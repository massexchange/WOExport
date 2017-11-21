define(["app/renderer"], function(Renderer) {
	return function(attributes, container) {
		var exports = {};

		var renderer = new Renderer(container);

		var render = exports.render = function() {
			return renderer.renderTemplate("attributes", attributes);
		};

		return exports;
	};
});
