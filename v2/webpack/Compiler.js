const { SyncHook, SyncBailHook, AsyncSeriesHook, AsyncParallelHook } = require('tapable');
const Compilation = require('./Compilation');
class Compiler {
  constructor(options) {
    this.hooks = {
      // 在 webpack 选项中的 entry 被处理过之后调用
      entryOption: new SyncBailHook(["context", "entry"]),

      // 插件初始化完成之后调用，用户插件和webpack插件
      afterPlugins: new SyncHook(["compiler"]),

      // 初始化调用
      initialize: new SyncHook(),

      // run之后调用
      run: new AsyncSeriesHook(["compiler"]),

      // compilation 创建之前调用
      compile: new SyncHook(),

      // compilation 创建之后调用
      compilation: new SyncHook(["compilation", "params"]),

      make: new AsyncParallelHook(["compilation"]),
    };

    this.context = options.context || process.cwd();
    this.options = options;

    if (Object.prototype.toString.call(options.entry) === "[object String]") {
      const entry = {}
      entry['index'] = options.entry;
      options.entry = entry;
    }
  }

  run () {
    this.hooks.run.callAsync(this, err => {
      if (err) return;

      this.compile();
    });
  }

  compile() {
    this.hooks.compile.call();
    const compilation = new Compilation(this);
    
    this.hooks.compilation.call(compilation);
    this.hooks.make.callAsync(compilation, (err) => {

    })
  }
}

module.exports = Compiler;