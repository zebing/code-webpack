class moduleGraph {
  constructor() {
    this.dependencyMap = new Map();
  }

  setResolvedModule (dependency, module) {
    this.dependencyMap.set(dependency, module);
  }
}

module.exports = moduleGraph;