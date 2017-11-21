define(["jquery", "app/renderer", "app/navigation", "app/userInfo", "app/util"],
function($, Renderer, Navigation, UserInfo, util) {
    var exports = {};

    exports.render = async function(container) {
        const renderer = new Renderer(container);
        await renderer.render("header");

        const nav = new Navigation(MX.modules, $("#nav-container"));
        const navP = nav.render();

        const infoP = UserInfo.render($("#nav-right-side"));

        return Promise.all([navP, infoP]);
    };

    return exports;
});
