class moduleGraph {
  constructor() {
    // { key => identifier, value => dependency }
    this.dependencyMap = new Map();

    // { key => dependency, value => module }
    this.moduleMap = new Map();
  }

  setResolvedModule (dependency, module) {
    const identifier = dependency.Identifier;
    this.dependencyMap.set(identifier, dependency);
    this.moduleMap.set(dependency, module);
  }

  getResolvedModule(dependency) {
    return this.moduleMap.get(dependency);
  }

  getResolvedDependency(identifier) {
    return this.dependencyMap.get(identifier);
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
        if (module && !allModules.has(module)) {
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