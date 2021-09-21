class Entrypoint {
  constructor(entryOptions, initial = true) {
		this.options = entryOptions;
		this._runtimeChunk = undefined;
		this._entrypointChunk = undefined;
		this._initial = initial;
  }

  setEntrypointChunk(chunk) {
    this._entrypointChunk = chunk;
  }
}

module.exports = Entrypoint;