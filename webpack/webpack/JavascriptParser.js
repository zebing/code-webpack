const { parse } = require('@babel/core');
const traverse = require('@babel/traverse').default;
const path = require('path');
const { ReplaceSource } = require('webpack-sources');
const Dependency = require('./Dependency');
const { 
  getIdentifiers, 
  evaluteJavascript,
  requireResolve,
  isGlobalName,
  loaderPitchResolve,
} = require('./shared');

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
    this.blockPreWalkStatements(ast);
    this.definitions.forEach((dep) => {
      state.module.dependencies.push(dep);
    });
    state.current._source = this.replaceSource;

    this.replaceSource = null;
    this.state = null;
    this.definitions.clear();
    return state;
  }

  blockPreWalkStatements(ast) {
    const that = this;

    traverse(ast, {

      // require
      CallExpression (p) {
        that.walkCallExpressionDeclaration(p.node);
      },

      // import test, {test1} from './test'
      ImportDeclaration(p) {
        that.blockPreWalkImportDeclaration(p.node);
      },

      // export default ...
      ExportDefaultDeclaration (p) {
        that.blockPreWalkExportDefaultDeclaration(p.node);
      },

      // export const name = ''
      ExportNamedDeclaration (p) {
        that.blockPreWalkExportNamedDeclaration(p.node);
      },

      // export * from '...' 
      ExportAllDeclaration (p) {
        that.blockPreWalkExportAllDeclaration(p.node);
      },

      MemberExpression (p) {
        that.walkMemberExpression(p.node);
      }
    });
  }

  walkCallExpressionDeclaration (statement) {
    if (statement.callee.name === 'require') {
      let resource = statement.arguments[0].value;
      const globalName = isGlobalName(resource, this.state.options.compiler.options.global);
      
      if (globalName) {
        this.replaceSource.replace(
          statement.start,
          statement.end,
          globalName
        );

      } else {
        this.replaceSource.replace(
          statement.callee.start,
          statement.callee.end - 1,
          '__webpack_require__'
        );
  
        resource = requireResolve(
          resource, 
          path.dirname(this.state.module.resource)
        );
  
        this.replaceSource.replace(
          statement.arguments[0].start,
          statement.arguments[0].end - 1,
          `'${resource.replace(process.cwd(), '.')}'`
        );

        this.definitions.add(new Dependency({ request: resource }));
      }
    }
  }

  blockPreWalkExportAllDeclaration(statement) {
		const source = statement.source.value;
    this.replaceSource.replace(
      statement.start,
      statement.end,
      ''
    );
    const moduleName = `WEBPACK_MODULE_REFERENCE_${moduleId++}`;
    const insertion = `
      var ${moduleName} = __webpack_require__('${source}') || {};
      Object.keys(${moduleName}).forEach(function (key) {
        __webpack_exports__[key] = ${moduleName}[key];
      })
    `;

    this.replaceSource.insert(
      statement.end,
      insertion
    );
	}

  walkMemberExpression(expression) {
    const identifiersList = getIdentifiers(expression);

    // 判断是否是module.exports...
    if (identifiersList[0] === 'module' && identifiersList[1] === 'exports') {
      let nameStr = identifiersList.slice(2).join('.') || 'default';

      const insertion = `__webpack_exports__.${nameStr} `

      this.replaceSource.replace(
        expression.start,
        expression.end,
        insertion
      );

      // process.env.key...
    } else if (
      identifiersList[0] === 'process' && 
      identifiersList[1] === 'env' &&
      identifiersList.length > 2
    ) {
      const value = evaluteJavascript(identifiersList.join('.'));
      this.replaceSource.replace(
        expression.start,
        expression.end,
        `${value}`
      );
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
        statement.end,
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
    let resource = statement.source.value;

    const globalName = isGlobalName(resource, this.state.options.compiler.options.global);
    
    if (globalName) {
      this.replaceSource.replace(
        statement.start,
        statement.end,
        ''
      );
      return;
    }

    const result = loaderPitchResolve(
      resource, 
      path.dirname(this.state.module.resource)
    );

    const moduleName = `WEBPACK_MODULE_REFERENCE_${moduleId++}`;
    const modulePath = result.isEffectDependency 
      ? resource
      : result.resource.replace(process.cwd(), '.')
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

    let options = { request: result.resource };

    if (result.isEffectDependency) {
      options = { 
        request: this.state.current.resource,
        rawRequest: resource,
        pitchLoader: result.loaders
      };
    } 
    
    this.definitions.add(new Dependency(options));
  }
}

module.exports = new JavascriptParser();