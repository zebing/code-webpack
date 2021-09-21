class Dependency {
  constructor(request) {
    this.request = request;
		this.userRequest = request;
    this.child = null;
  }

  get type() {
    return 'unknown';
  }
}

module.exports = Dependency;