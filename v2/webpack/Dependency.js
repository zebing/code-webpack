class Dependency {
  constructor(request) {
    this.request = request;
		this.userRequest = request;
  }

  get type() {
    return 'unknown';
  }
}

module.exports = Dependency;