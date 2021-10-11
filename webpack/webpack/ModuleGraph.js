class moduleGraph {
  constructor() {
    this.dependencyMap = new Map();
    this.resourceMap = new Map();
  }

  getDependency (resource) {
    return this.resourceMap.get(resource);
  }

  setResolvedModule (dependency, module) {
    this.resourceMap.set(module.resource, dependency);
    this.dependencyMap.set(dependency, module);
  }

  getResolvedModule(dependency) {
    return this.dependencyMap.get(dependency);
  }

  getAllmodule(entryModule) {
    const allModules = new Set();
    allModules.add(entryModule)
    let dependencies = entryModule.dependencies;

    while(dependencies.length) {
      let subDependencies = [] ;
      let dep = dependencies.shift();

      while (dep) {
        const module = this.getResolvedModule(dep);
        if (module) {
          allModules.add(module);
          subDependencies = [...subDependencies, ...module.dependencies];
        }
        dep = dependencies.shift();
      }

      dependencies = subDependencies;
    }

    return allModules;  
  }
}

module.exports = moduleGraph;