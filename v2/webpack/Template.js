const { ConcatSource } = require('webpack-sources');

class Template {

	static renderChunkModules(modules = new Set(), renderModule, prefix = "") {
		var source = new ConcatSource();
		if (modules.length === 0) {
			return null;
		}
		/** @type {{id: string|number, source: Source|string}[]} */
		const allModules = Array.from(modules).map(module => {
			return {
				id: module.name,
				source: renderModule(module) || "false"
			};
		});

		source.add("{\n");
		for (let i = 0; i < allModules.length; i++) {
			const module = allModules[i];
			if (i !== 0) {
				source.add(",\n");
			}
			source.add(`\n/***/ ${JSON.stringify(module.id)}:\n`);
			source.add(module.source);
		}
		source.add(`\n\n${prefix}}`);

		return source;
	}
}

module.exports = Template;
