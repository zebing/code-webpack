class moduleGraph {
  constructor() {
    this.dependencyMap = new Map();
  }

  setResolvedModule (dependency, module) {
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
        allModules.add(module);
        subDependencies = [...subDependencies, ...module.dependencies];
        dep = dependencies.shift();
      }

      dependencies = subDependencies;
    }

    return allModules;  
  }
}

module.exports = moduleGraph;