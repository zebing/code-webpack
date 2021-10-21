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
      // import test, {test1} from './test'
      case "ImportDeclaration":
        this.blockPreWalkImportDeclaration(statement);
        break;
      
      // export default ...
      case "ExportDefaultDeclaration":
        this.blockPreWalkExportDefaultDeclaration(statement);
        break;
      
      // export const name = ''
      case "ExportNamedDeclaration":
        this.blockPreWalkExportNamedDeclaration(statement);
        break;

      // export * from '...' 
      case "ExportAllDeclaration":
				this.blockPreWalkExportAllDeclaration(statement);
				break;

      // left = right; 主要是module.exports = ...
      case "ExpressionStatement":
        this.walkExpressionStatement(statement);
        break;
      default:

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

  walkExpressionStatement(statement) {
    this.walkExpressionStatement(statement);
  }

  walkExpressionStatement(statement) {
		this.walkExpression(statement.expression);
	}

  walkExpression(expression) {
		switch (expression.type) {
			case "AssignmentExpression":
				this.walkAssignmentExpression(expression);
				break;
      default:
    }
  }

  walkAssignmentExpression(expression) {
    // module.exports 表达式转换
    if (expression.left.type === "MemberExpression") {
      let object = expression.left.object;
      let property = expression.left.property;

      // module.exports.name.name...的情况
      while (object.type !== 'Identifier') {
        object = object.object;
        property = object.property;
      }

      // 判断是否是module.exports...
      if (object.name === 'module' && property.name === 'exports') {
        let object = expression.left.object;
        let property = expression.left.property;
        let nameStr = 'default'; // module.exports = ... 的情况

        // module.exports.name...的情况
        if (property.name !== 'exports') {
          nameStr = property.name;
          object = object.object;

          while(object.property.name !== 'exports') {
            nameStr = `${object.property.name}.${nameStr}`
            object = object.object;
          }
        }

        const insertion = `__webpack_exports__.${nameStr} `

        this.replaceSource.replace(
          expression.left.start,
          expression.left.end,
          insertion
        );
      }
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
    let isEffectDependency = false;
    let resource = statement.source.value;
    let loaders = undefined;

    // pitching 
    const pitchReg = /^(!!|-!|!)/gi;
    if (pitchReg.test(resource)) {
      // 处理style loader js文件路径
      if (/^!.+?\.js$/gi.test(resource)) {
        resource = resource.replace('!', '');

      } else {
        isEffectDependency = true;
        const rules = resource.replace(pitchReg, '').split('!');
        resource = path.resolve(
          path.dirname(this.state.module.resource),
          rules.pop()
        );

        loaders = rules.map((value) => {
          const url = value.split('??');
          const loader = require.resolve(
            path.resolve(
              path.dirname(this.state.module.resource),
              url[0]
            )
          );

          return {
            ident: url[1],
            loader,
            options: undefined
          }
        })
      }
    }

    try {
      resource = require.resolve(resource)
    } catch(err) {
      const dirname = path.dirname(this.state.module.resource)
      resource = require.resolve(
        path.resolve(
          dirname,
          statement.source.value
        )
      );
    }

    const moduleName = `WEBPACK_MODULE_REFERENCE_${moduleId++}`;
    const modulePath = isEffectDependency 
      ? statement.source.value
      : resource.replace(process.cwd(), '.')
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

    let dependency;
    if (isEffectDependency) {
      dependency = new Dependency({ 
        request: this.state.current.resource,
        rawRequest: statement.source.value,
        pitchLoader: loaders
      });
    } else {
      dependency = 
        this.state.compilation.moduleGraph.getDependency(resource) || 
        new Dependency({ request: resource });
    }

    this.definitions.add(dependency);
  }
}

module.exports = new JavascriptParser();