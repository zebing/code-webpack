class Chunk {
  constructor(name) {
    this.name = name;
    this.entryModule = null;
  }

  setEntryModule(module) {
    this.entryModule = module;
  }
}

module.exports = Chunk;