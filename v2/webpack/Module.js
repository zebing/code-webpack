const { getContext, runLoaders } = require("loader-runner");

class Module {
  constructor ({ 
    context,
    request,
    resource,
    loaders,
    parser
  }) {
    this.context = context;
    this.request = request;
    this.resource = resource;
    this.parser = parser;
    this.loaders = loaders;
    
    // Info from Build
    this._source = null;
    this._sourceSizes = undefined;
  }

  identifier() {
		return this.request
	}

  build () {

  }
}

module.exports = Module;