const Module = require('./Module');
const javascriptParser = require('./JavascriptParser');
let ruleSetId = 1;

module.exports = {
  create(options, callback) {
    const { dependencies, context, compilerOptions } = options;
    const dep = dependencies[0];

    const resolveData = {
      compilerOptions,
			context,
			request: dep.request,
			rawRequest: dep.rawRequest,
			dependencies,
		};

    this.resolve(resolveData, (err, result) => {
      const module = this.createModule(result);
      callback(null, module);
    })
  },

  createModule (options) {
    return new Module(options)
  },

  resolve(resolveData, callback) {
    let { 
      compilerOptions,
			context,
			request,
			dependencies,
      rawRequest,
    } = resolveData;
    const resource = request;
    const loaders = this.getLoader(
      compilerOptions.module && compilerOptions.module.rules,
      dependencies
    );

    loaders.forEach((item) => {
      request = `${item.loader}!${request}`
    });

    const createDate = {
      context,
      loaders,
      request,
      resource,
      parser: javascriptParser,
      name: rawRequest.replace(process.cwd(), '.')
    }

    callback(null, createDate)
  },

  getLoader(rules = [], dependencies) {
    const dep = dependencies[0];
    const resource = dep.request;
    let loaders = [];
    if (dep.pitchLoader) {
      return dep.pitchLoader;
    }

    rules.forEach((item) => {
      if (item.test.test(resource)) {
        item.use.forEach((item, index) => {
          if (typeof item === 'string') {
            loaders.push({
              loader: require.resolve(item),
              options: null
            })
          } else {
            item.loader = require.resolve(item.loader)
            if (!item.ident) {
              item.ident = `clonedRuleSet-${ruleSetId++}.use[${index}]`
            }
            loaders.push(item)
          }
        });
      }
    });

    return loaders;
  }
}