define(["jquery", "app/renderer", "app/util"],
function($, Renderer, util) {
    var exports = {};

    exports.render = function(container) {
        const renderer = new Renderer(container);

        $("#export").click(() => {
        	
        });

        return renderer.render("topBar");
    };

    return exports;
});
