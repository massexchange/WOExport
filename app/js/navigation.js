define(["app/hub", "app/util", "app/router", "app/renderer"], function(hub, util, Router, Renderer) {
    return function(modules, container) {
        var exports = {
            modules, container
        };

        var activeClass = "selected";

        var menu;

        var onRouteChanged = (nav, { route }) => {
            if(route.length == 0)
                return;

            $(".selected", nav).removeClass(activeClass);

            var pathArr = route.split('/');
            var topEl = menu.children(`[data-name=${pathArr[0]}]`);

            topEl.addClass(activeClass);

            var title = topEl.find("a").map((i, e) => $(e).text()).get().join(" > ");
            $("#header .navbar-header").text(title);
        };

        var onRender = nav => {
            menu = nav;

            nav.find("a").click(function() {
                Router.navigate($(this).attr("href"), true);
                return false;
            });

            hub.sub("app/location", path => onRouteChanged(nav, path));
        };

        var filterModules = modules => {
            var modulesSubset = modules.filter(module => {
                //Filter by mpRole
                if(![MX.session.creds.user.mp.role, "BOTH", "STAFF"]
                    .some(role => module.mpRole == role))
                    return;

                //Filter by user permission
                if(!MX.session.creds.user.perms.some(perm =>
                    module.allowedUserRoles.some(role =>
                        perm.permission.authority == role || role == "ANY")))
                    return;

                return true;
            }).map(util.cloneSimple);

            //If module is a category (has child modules)
            modulesSubset.filter(module => module.children).forEach(module =>
                //recursively filter those
                module.children = filterModules(module.children));

            return modulesSubset;
        };

        exports.render = function() {
            const renderer = new Renderer(container);
            const modulesSubset = filterModules(modules);

            return renderer.renderTemplate("navigation", modulesSubset)
                .then(onRender);
        };

        var unrender = function() {
            container.empty();
        };

        return exports;
    };
});
