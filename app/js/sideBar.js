define(["jquery", "app/renderer", "app/util"],
function($, Renderer, util) {
    var exports = {};

    exports.render = function(container) {
        const renderer = new Renderer(container);
        return renderer.render("sideBar");
    };

    return exports;
});
