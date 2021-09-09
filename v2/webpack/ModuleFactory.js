const Module = require('./Module');

module.exports = {
  create(options, callback) {
    const { dependencies, context, compilerOptions } = options;
    const dep = dependencies[0];

    const resolveData = {
      compilerOptions,
			context,
			request: dep.request,
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
      parser: null
    }

    callback(null, createDate)
  },

  getLoader(rules = [], dependencies) {
    const dep = dependencies[0];
    const resource = dep.request;
    let loaders = [];

    rules.forEach((item) => {
      if (item.test.test(resource)) {
        item.use.forEach((item) => {
          if (typeof item === 'string') {
            loaders.push({
              loader: require.resolve(item),
              options: null
            })
          } else {
            item.loader = require.resolve(item.loader)
            loaders.push(item)
          }
        });
      }
    });

    return loaders;
  }
}