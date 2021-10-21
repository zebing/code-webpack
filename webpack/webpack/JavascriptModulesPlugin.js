
const { ConcatSource, CachedSource } = require('webpack-sources');
const Template = require('./Template');

class JavascriptModulesPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(
      'JavascriptModulesPlugin',
      (compilation) => {
        compilation.hooks.renderManifest.tap(
					"JavascriptModulesPlugin",
					(result, options) => {
						const {
							chunk,
              hash,
              fullHash,
              outputOptions,
              codeGenerationResults,
              moduleTemplates,
              dependencyTemplates,
              chunkGraph,
              moduleGraph,
              runtimeTemplate
						} = options;

            const filenameTemplate = compiler.options.output;

						const render = () =>
              this.renderMain(
                {
                  hash,
                  chunk,
                  dependencyTemplates,
                  runtimeTemplate,
                  moduleGraph,
                  chunkGraph,
                  codeGenerationResults
                },
                this.hooks,
                compilation
              );

						result.push({
							render,
							filenameTemplate,
							pathOptions: {
								chunk,
							},
							identifier: chunk.id,
						});

						return result;
					}
				);
      }
    )
  }

  renderMain(renderContext, hooks, compilation) {
    const { moduleGraph, chunk } = renderContext;
    const source = new ConcatSource();
    const allModules = moduleGraph.getAllmodule(chunk.entryModule);
    let prefix = "/******/ \t";
    source.add("/******/ (function() { // webpackBootstrap\n");
    source.add(prefix + '"use strict";\n');

    const chunkModules = Template.renderChunkModules(
			allModules,
			module => this.renderModule(module, {}, this.hooks, true),
			prefix
		);;

    if (chunkModules) {
      source.add(prefix + "var __webpack_modules__ = (");
			source.add(chunkModules || "{}");
			source.add(");\n");
			source.add(
				"/************************************************************************/\n"
			);
      source.add(`
        var __webpack_module_cache__ = {};

        function __webpack_require__(moduleId) {
          if (__webpack_module_cache__[moduleId]) {
            return __webpack_module_cache__[moduleId].exports;
          }
      
          var module = __webpack_module_cache__[moduleId] = {
            id: moduleId,
            exports: {}
          };
      
          __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
      
          return module.exports;
        }
      `);
      source.add(
				"\n/************************************************************************/\n"
			);
    }

    source.add(`${prefix} __webpack_require__('${chunk.entryModule.name}');\n`);
    source.add(prefix + '})()');
    return new ConcatSource(source, ';')
  }

  renderModule(module, renderContext, hooks, factory) {
    const moduleSource = new ConcatSource(module._source);
    const factorySource = new ConcatSource();
    const args = [
      'module',
      '__webpack_exports__',
      '__webpack_require__'
    ];
    factorySource.add("/***/ (function(" + args.join(", ") + ") {\n\n");
    // factorySource.add('"use strict";\n');
    factorySource.add(moduleSource);
    factorySource.add("\n\n/***/ })");
		return new CachedSource(factorySource);
  }
}

module.exports = JavascriptModulesPlugin;