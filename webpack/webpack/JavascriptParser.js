const { parse } = require('@babel/core');
const path = require('path');
const { ReplaceSource } = require('webpack-sources');
const Dependency = require('./Dependency');

let moduleId = 1;

class JavascriptParser {
  constructor() {
    this.definitions = new Set();
    this.state = null;
    this.replaceSource = null;
  }

  parse (source, state) {
    this.state = state;
    this.replaceSource = new ReplaceSource(state.current._source);
    if (Buffer.isBuffer(source)) {
      source = source.toString('utf-8');
    }

    const ast = typeof source === 'object' ? source : parse(source);
    this.blockPreWalkStatements(ast.program.body);
    this.definitions.forEach((dep) => {
      state.module.dependencies.push(dep);
    });
    state.current._source = this.replaceSource;

    this.replaceSource = null;
    this.state = null;
    this.definitions.clear();
    return state;
  }

  blockPreWalkStatements(statements) {
    const source = new ReplaceSource();
    const len = statements.length;
    for (let index = 0; index < len; index++) {
      this.blockPreWalkStatement(statements[index]);
    }
  }

  blockPreWalkStatement(statement) {
    switch(statement.type) {
      case "ImportDeclaration":
        this.blockPreWalkImportDeclaration(statement);
        break;
      case "ExportDefaultDeclaration":
        this.blockPreWalkExportDefaultDeclaration(statement);
        break;
      case "ExportNamedDeclaration":
        this.blockPreWalkExportNamedDeclaration(statement);
        break;
      default:

    }
  }

  blockPreWalkExportNamedDeclaration(statement) {
    if (statement.declaration) {
      this.replaceSource.replace(
        statement.start,
        statement.declaration.start - 1,
        ''
      );
      let insertion = '';
      statement.declaration.declarations.forEach((node) => {
        const name = this.blockPreWalkExportNamedDeclarationName(node);
        insertion = `
          ${insertion}
          __webpack_exports__.${name} = ${name};
        `
      });
      this.replaceSource.insert(
        statement.end,
        insertion
      );
      return;
    }

    if (statement.specifiers.length) {
      const specifier = statement.specifiers[0];
      this.replaceSource.replace(
        statement.start,
        specifier.end,
        ''
      );
      const name = this.blockPreWalkExportNamedDeclarationName(specifier);
      const insertion = `
        __webpack_exports__.default = ${name};
      `;
      this.replaceSource.insert(
        specifier.end,
        insertion
      );
    }
  }

  blockPreWalkExportNamedDeclarationName(node) {
    switch(node.type) {
      case "VariableDeclarator":
        return node.id.name;
      case "ExportSpecifier":
        return node.local.name;
      default:
        return node.id.name;
    }
  }

  blockPreWalkExportDefaultDeclaration(statement) {
    this.replaceSource.replace(
      statement.start,
      statement.declaration.start - 2,
      '__webpack_exports__.default = '
    );
  }

  blockPreWalkImportDeclaration (statement) {
    let resource;
    try {
      resource = require.resolve(statement.source.value)
    } catch(err) {}

    if (!resource) {
      const dirname = path.dirname(this.state.module.resource)
      resource = require.resolve(
        path.resolve(
          dirname,
          statement.source.value
        )
      );
    }

    const moduleName = `WEBPACK_MODULE_REFERENCE_${moduleId++}`;
    const modulePath = resource.replace(process.cwd(), '.')
    let replacement = `
      var ${moduleName} = __webpack_require__('${modulePath}');
    `;
    statement.specifiers.forEach((node) => {
      const name = node.local.name;
      if (node.type === 'ImportDefaultSpecifier') {
        replacement = `
          ${replacement}
          var ${name} = ${moduleName}.default;
        `
      } else {
        replacement = `
          ${replacement}
          var ${name} = ${moduleName}.${name};
        `
      }
    })

    this.replaceSource.replace(
      statement.start,
      statement.end,
      replacement
    );

    this.definitions.add(
      new Dependency(resource)
    );
  }
}

module.exports = new JavascriptParser();