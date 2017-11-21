define(["jquery", "app/renderer", "app/header"],
function($, Renderer, Header) {
    var exports = {};

    exports.render = async container => {
        const renderer = new Renderer(container);

        await renderer.render("main");
        //await Header.render($("#header"));
    };

    return exports;
});
