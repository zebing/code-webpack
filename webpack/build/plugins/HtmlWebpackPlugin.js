const { RawSource } = require("webpack-sources");
const path = require('path');
const fs = require('fs');

class HtmlWebpackPlugin {
  constructor(config) {
    this.template = (config && config.template);
  }

  apply (compiler) {
    compiler.hooks.emit.tap('HtmlWebpackPlugin', (compilation) => {
      const templte = this.getTemplate();
      Object.keys(compilation.assets).forEach((file) => {
        let dir = path.dirname(file);
        const filename = file.replace(dir, '');
        const name = dir === '.' ? 'index.html' : dir + '/index.html';
        const html = templte.replace('</head>', `  <script defer src="./${filename}"></script>\n</head>`);
        compilation.assets[name] = new RawSource(html);
      })
    })
  }

  getTemplate() {
    return fs.readFileSync(this.template || path.resolve('./index.html'), "utf-8");
  }
}

module.exports = HtmlWebpackPlugin;