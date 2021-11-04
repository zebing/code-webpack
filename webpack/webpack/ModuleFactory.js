const Module = require('./Module');
const javascriptParser = require('./JavascriptParser');
let ruleSetId = 1;

module.exports = {
  create(options, callback) {
    const { dependency, context, compilerOptions } = options;

    const resolveData = {
      compilerOptions,
			context,
			request: dependency.request,
			rawRequest: dependency.rawRequest,
			dependency,
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
			dependency,
      rawRequest,
    } = resolveData;
    const resource = request;
    const loaders = this.getLoader(
      compilerOptions.module && compilerOptions.module.rules,
      dependency
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

  getLoader(rules = [], dependency) {
    const resource = dependency.request;
    let loaders = [];
    if (dependency.pitchLoader) {
      return dependency.pitchLoader;
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