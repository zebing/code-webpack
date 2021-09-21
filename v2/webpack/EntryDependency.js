const Dependency = require('./Dependency');

class EntryDependency extends Dependency{
  constructor(entry) {
    super(entry);
  }

  get type() {
    return 'entry'
  }
}

module.exports = EntryDependency;