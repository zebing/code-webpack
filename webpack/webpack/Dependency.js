class Dependency {
  constructor({ request, userRequest, rawRequest, pitchLoader }) {
    this.request = request;
		this.userRequest = userRequest || request;
		this.rawRequest = rawRequest || request;
    this.pitchLoader = pitchLoader;
    this.child = null;
  }

  get type() {
    return 'unknown';
  }
}

module.exports = Dependency;