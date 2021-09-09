const { SyncHook } = require('tapable');
const ModuleGraph = require('./ModuleGraph');
const factory = require('./ModuleFactory');
class Compilation {
  constructor(compiler) {
    this.hooks = {
      addEntry: new SyncHook(["entry"]),
      buildModule: new SyncHook(["module"]),
      executeModule: new SyncHook(["options", "context"]),
      beforeChunks: new SyncHook([]),
			afterChunks: new SyncHook(["chunks"]),
    };

    this.compiler = compiler;
		this.options = compiler.options;
    this.entries = new Map();
    this.entrypoints = new Map();
    this.moduleGraph = new ModuleGraph();
    this.modules = new Set();
    this.assets = {};
  }

  addEntry (entry, name) {
    const entryData = {
      dependencies: [entry],
      includeDependencies: [],
      options: {
        name,
      }
    };
    
    this.entries.set(entry, entryData);
    this.hooks.addEntry.call(entry);

    this.handleModuleCreation({ dependencies: [entry] })
  }

  handleModuleCreation ({ dependencies }) {
    const dependency = dependencies[0];
    factory.create({
      dependencies,
      compilerOptions: this.compiler.options,
      context: this.compiler.context
    }, (err, newModule) => {
      this.addModule(newModule);
      this.moduleGraph.setResolvedModule(dependency, newModule);
    })
  }

  // 添加模块
  addModule (module) {
    const identifier = module.identifier();
    const alreadyAddedModule = this.modules.get(identifier);
    if (alreadyAddedModule) {
      return alreadyAddedModule;
    }

    this.modules.set(identifier, module);
    return module;
  }

  buildModule (module) {
    this.hooks.buildModule.call(module);
  }
}

module.exports = Compilation;