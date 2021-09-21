const { SyncHook, AsyncSeriesHook, SyncWaterfallHook } = require('tapable');
const ModuleGraph = require('./ModuleGraph');
const factory = require('./ModuleFactory');
const Chunk = require('./Chunk');
const Entrypoint = require('./Entrypoint');
class Compilation {
  constructor(compiler) {
    this.hooks = {
      addEntry: new SyncHook(["entry"]),
      buildModule: new SyncHook(["module"]),
      succeedModule: new SyncHook(["options", "context"]),
      finishModules: new AsyncSeriesHook(["modules"]),
      beforeChunks: new SyncHook([]),
			renderManifest: new SyncWaterfallHook(["result", "options"]),
			afterChunks: new SyncHook(["chunks"]),
    };

    this.compiler = compiler;
		this.options = compiler.options;
    this.entries = new Map();
    this.entrypoints = new Map();
    this.moduleGraph = new ModuleGraph();
    this.modules = new Map();
    this.chunks = new Set();
    this.assets = {};
  }

  addEntry (entry, name, callback) {
    const entryData = {
      dependencies: [entry],
      options: {
        name,
      }
    };
    
    this.entries.set(name, entryData);
    this.hooks.addEntry.call(entry);

    this.handleModuleCreation({ dependencies: [entry] }, (err) => {
      callback();
    })
  }

  handleModuleCreation ({ dependencies }, callback) {
    const dependency = dependencies[0];

    // 创建module
    factory.create({
      dependencies,
      compilerOptions: this.compiler.options,
      context: this.compiler.context
    }, (err, newModule) => {
      // 添加module
      this.addModule(newModule);
      this.moduleGraph.setResolvedModule(dependency, newModule);
      
      // build module
      this.buildModule(newModule, (err) => {
        
        // 循环遍历依赖
        this.processModuleDependencies(newModule, (err) => {
          callback(null);
        })
      })
    })
  }

  processModuleDependencies(module, callback) {
    const leng = module.dependencies.length;
    if (!leng) {
      return callback(null);
    }

    module.dependencies.forEach((dep, index) => {
      this.handleModuleCreation({
        dependencies: [dep]
      }, (err) => {
        if (index === leng - 1) {
          callback();
        }
      });
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

  buildModule (module, callback) {
    this.hooks.buildModule.call(module);

    module.build({
      compilation: this,
      compiler: this.compiler,
      options: this.options
    }, (err) => {
      this.hooks.succeedModule.call(module);
      callback();
    })
  }

  finish(callback) {
    const { modules } = this;
    this.hooks.finishModules.callAsync(modules, (err) => {
      callback();
    })
  }

  seal(callback) {
    this.hooks.beforeChunks.call();

    for (const [name, { dependencies, options }] of this.entries) {
      const chunk = this.addChunk(name);
      const entryModule = this.moduleGraph.getResolvedModule(dependencies[0]);
      chunk.setEntryModule(entryModule);
      const entrypoint = new Entrypoint(options);
      entrypoint.setEntrypointChunk(chunk);
      this.entrypoints.set(name, entrypoint);
    }

    this.hooks.afterChunks.call(this.chunks);
    this.createChunkAssets();
    callback();
  }

  addChunk(name) {
    const chunk = new Chunk(name);
    this.chunks.add(chunk);
    return chunk;
  }

  getRenderManifest(options) {
		return this.hooks.renderManifest.call([], options);
	}

  createChunkAssets() {
    this.chunks.forEach((chunk) => {
      const manifest = this.getRenderManifest({
        chunk,
        outputOptions: this.options.output,
        codeGenerationResults: this.codeGenerationResults,
        moduleTemplates: this.moduleTemplates,
        dependencyTemplates: this.dependencyTemplates,
        moduleGraph: this.moduleGraph,
      });
      const simpleEntry = this.entries.size <= 1;
      manifest.forEach((fileManifest) => {
        const source = fileManifest.render();
        const file = fileManifest.filenameTemplate.file.replace(
          '[name]', 
          simpleEntry 
            ? fileManifest.pathOptions.chunk.name
            : fileManifest.pathOptions.chunk.name + '/index'
        );
        this.emitAsset(file, source);
      })
    })
  }

  emitAsset(file, source) {
    this.assets[file] = source;
  }
}

module.exports = Compilation;