const EntryDependency = require('../EntryDependency');

class EntryPlugin {
  apply (compiler) {
    compiler.hooks.entryOption.tap('EntryPlugin', (context, entry = {}) => {
      if (typeof entry === 'string') {
        entry = {
          index: entry
        }
      }

      for (let key in entry) {
        this.addEntry(compiler, entry[key], key)
      }
    })
  }

  addEntry(compiler, entry, name) {
    compiler.hooks.make.tapAsync('EntryPlugin', (compilation, callback) => {
      const dep = EntryPlugin.createDependency(entry);

      compilation.addEntry(dep, name, err => {
        callback(err);
      });
    })
  }

  static createDependency(entry) {
    const dep = new EntryDependency(entry);
    return dep;
  }
}

module.exports = EntryPlugin;