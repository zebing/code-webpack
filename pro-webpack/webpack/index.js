const Compiler = require('./Compiler');
const EntryPlugin = require('./plugins/EntryPlugin');
const JavascriptModulesPlugin = require('./JavascriptModulesPlugin');

const webpack = function (options) {
  const compiler = new Compiler(options);

  // 安装插件
  if (Array.isArray(options.plugins)) {
    options.plugins.forEach(plugin => {
      plugin.apply(compiler)
    });
  }

  new EntryPlugin().apply(compiler);
  new JavascriptModulesPlugin().apply(compiler);
  compiler.hooks.entryOption.call(compiler.options.context, compiler.options.entry);
  compiler.hooks.afterPlugins.call(compiler);
  
  // 调用initialize钩子
  compiler.hooks.initialize.call();

  return compiler;
}

module.exports = webpack
