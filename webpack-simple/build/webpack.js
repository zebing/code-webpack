const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

class Webpack {
  constructor(config) {
    this.config = config;
  }

  run () {
    this.readFile(this.config.entry);
  }

  assets(results = []) {

    const modules = [];
    results.map((module) => {
      modules.push(`
        '${module.filePath}': function (module, exports, require) {
          ${module.code}
        }
      `);
    });

    const code = `
      const modules = {
        ${modules.join()}
      }

      var __webpack_module_cache__ = {};

      function require(moduleId) {
        console.log(modules, moduleId)
      
        if(__webpack_module_cache__[moduleId]) {
          return __webpack_module_cache__[moduleId].exports;
        }
      
        var module = __webpack_module_cache__[moduleId] = {
          exports: {}
        };
      
        modules[moduleId](module, module.exports, require);
      
        return module.exports;
      }

      require('${this.config.entry}');
    `

    const dir = path.dirname(path.resolve(this.config.output));
    // 将代码写入bundle
    fs.mkdir(dir, { recursive: true }, (err) => {
      fs.writeFile(
        path.resolve(this.config.output),
        code,
        'utf8',
        () => {}
      );

      // 处理index.html
      let html = fs.readFileSync(path.resolve('./index.html'), "utf-8");
      html = html.replace('</head>', `  <script defer src="./index.js"></script>\n</head>`);

      fs.writeFile(
        `${dir}/index.html`,
        html,
        'utf8',
        () => {}
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
    const text = fs.readFileSync(path.resolve('src', filePath.replace('/src', '')), "utf-8");
    const ast = babel.parse(text);
    const dependences = [];

    babel.traverse(ast, {
      ImportDeclaration(p) {
        dependences.push(p.node.source.value);
      },
    });

    const { code } = babel.transformFromAstSync(ast, null,{
      presets:["@babel/preset-env"]
    });

    return {
      code,
      dependences,
      filePath
    }
  }
}

module.exports = Webpack;
