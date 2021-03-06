const fs = require('fs');
const { getContext, runLoaders } = require("loader-runner");
const { RawSource } = require("webpack-sources");

const asBuffer = input => {
	if (!Buffer.isBuffer(input)) {
		return Buffer.from(input, "utf-8");
	}
	return input;
};

const asString = input => {
	if (Buffer.isBuffer(input)) {
		return input.toString("utf-8");
	}
	return input;
};

class Module {
  constructor ({ 
    context,
    request,
    resource,
    loaders,
    parser,
    name,
    binary = false
  }) {
    this.context = context;
    this.request = request;
    this.resource = resource;
    this.parser = parser;
    this.loaders = loaders;
    this.binary = binary;
    this.name = name;
    
    // Info from Build
    this._source = null;
    this._sourceSizes = undefined;
    this._ast = null;
    this.dependencies = [];
  }

  identifier() {
		return this.resource;
	}

  build (options, callback) {
    const { compilation, } = options;
    this.doBuild(options, (err) => {
      const result = this.parser.parse(this._ast || this._source.source(), {
        current: this,
        module: this,
        compilation: compilation,
        options: options
      });
      callback();
    })
  }

  doBuild (options, callback) {
    const processResult = (err, originResult) => {
      if (!originResult.result) {
        this._source = new RawSource('// code');
        callback();
        return;
      }
      const result = originResult.result[0];
      
      this._source = new RawSource(
        this.binary ? asBuffer(result) : asString(result)
      )

      callback();
    }

    const loaderContext = this.createLoaderContext(options);
    runLoaders({
      resource: this.resource,
      loaders: this.loaders,
      context: loaderContext,
      processResource: (loaderContext, resource, callback) => {
        fs.readFile(resource, callback);
      }
    }, processResult)
  }

  createLoaderContext({
    compilation,
    compiler
  }) {
    const options = compiler.options;

    return {
      getOptions(options) {
        return options
      },
      emitError (error) {

      },
      resolve(context, request, callback) {
				
			},
      getResolve (options) {

      },
      addBuildDependency (dep) {

      },
      fs,
      rootContext: options.context,
      _compilation: compilation,
      _compiler: compiler,
      _module: this,
    }
  }
}

module.exports = Module;