const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const types = babel.types;

class Webpack {
  constructor(config) {
    this.config = config;
  }

  run () {
    this.readFile(this.config.entry);
  }

  assets(results = []) {

    /********** module ********************/
    const properties = results.map((item) => {
      let block = babel.template.ast(item.code);
      block = block instanceof Array ? block : [block];

      return types.ObjectProperty(
        types.StringLiteral(item.filePath),
        types.FunctionExpression(
          null,
          [
            types.Identifier('__unused_webpack_module'),
            types.Identifier('__webpack_exports__'),
            types.Identifier('__webpack_require__')
          ],
          types.BlockStatement(block)
        )
      )
    });

    const module = types.VariableDeclaration(
      'var',
      [
        types.VariableDeclarator(
          types.Identifier('__webpack_modules__'),
          types.ObjectExpression(properties)
        )
      ]
    )

    /***************** module cache **********************/
    const cache = babel.template.ast(`
      var __webpack_module_cache__ = {};

      function __webpack_require__(moduleId) {
      
        if(__webpack_module_cache__[moduleId]) {
          return __webpack_module_cache__[moduleId].exports;
        }
      
        var module = __webpack_module_cache__[moduleId] = {
          exports: {}
        };
      
        __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
      
        return module.exports;
      }
    `);

    /******************* load entry module *******************/
    const entryModule = types.ExpressionStatement(
      types.CallExpression(
        types.Identifier('__webpack_require__'),
        [
          types.StringLiteral(this.config.entry)
        ]
      )
    )


    const ast = types.File(
      types.Program([
        types.ExpressionStatement(
          types.CallExpression(
            types.FunctionExpression(
              null,
              [],
              types.BlockStatement([
                module,
                ...cache,
                entryModule
              ],[
                types.Directive(
                  types.DirectiveLiteral('use strict')
                )
              ])
            ),
            []
          )
        )
      ])
    )
    
    const code = babel.transformFromAstSync(ast).code;
    const dir = path.dirname(path.resolve(this.config.output));
    // 将代码写入bundle
    fs.mkdir(dir, { recursive: true }, (err) => {
      fs.writeFile(
        path.resolve(this.config.output),
        code,
        'utf8',
        () => {
  
        }
      );

      const relativePath = path.relative(
        path.dirname(path.resolve(this.config.output)),
        path.resolve(this.config.output)
      )
      // 处理index.html
      let html = fs.readFileSync(path.resolve('./index.html'), "utf-8");
      html = html.replace('</head>', `  <script defer src="./${relativePath}"></script>\n</head>`);

      fs.writeFile(
        `${dir}/index.html`,
        html,
        'utf8',
        () => {
  
        }
      )
    });
  }

  readFile (filePath) {
    const result = this.parseFile(filePath);
    const results = [result];

    result.dependences.forEach((value) => {
      const re = this.parseFile(value);
      results.push(re);
    });
    this.assets(results);
  }

  parseFile (filePath) {
    const text = fs.readFileSync(path.resolve(filePath), "utf-8");
    const ast = babel.parse(text);
    const dependences = [];

    babel.traverse(ast, {
      // 将import test from './test.js' 节点替换成
      // var test = __webpack_require__('./test.js')
      ImportDeclaration(p) {
        const name = p.node.specifiers[0].local.name;
        const importFilePath = path.join(path.dirname(filePath), `${p.node.source.value}.js`);
        dependences.push(importFilePath);

        // 替换import节点
        const importNode = types.variableDeclaration('const', [
          types.variableDeclarator(
            types.identifier(name),
            types.MemberExpression(
              types.callExpression(
                types.identifier("__webpack_require__"), 
                [
                  types.stringLiteral(importFilePath),
                ]
              ),
              types.Identifier('default')
            )
          )
        ]);
        p.replaceWith(importNode);
      },

      ExportDefaultDeclaration(p) {
        // 跟前面import类似的，创建一个变量定义节点
        const variableDeclaration = types.ExpressionStatement(
          types.AssignmentExpression(
            '=', 
            types.MemberExpression(
              types.Identifier('__webpack_exports__'),
              types.Identifier('default')
            ),
            p.node.declaration
          )
        )

        // 将当前节点替换为变量定义节点
        p.replaceWith(variableDeclaration);
      }
    });

    const code = babel.transformFromAstSync(ast).code;

    return {
      code,
      dependences,
      filePath
    }
  }
}

module.exports = Webpack;