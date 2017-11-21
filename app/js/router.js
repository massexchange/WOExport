define(["app/util", "app/hub", "location-bar"], function(util, hub, LocationBar) {
    var router = {};

    var handle = (route = "") => {
        if(route == null)
            route = "";

        router.current = route;
        hub.pub(`app/route/${route}`, {
            route,
            path: route.split("/")
        });
    };

    var locationBar = new LocationBar();
    locationBar.onChange(handle);

    router.navigate = (dest, trigger = true) =>
        locationBar.update(dest, { trigger });

    router.goDeeper = (dest, trigger = true) =>
        router.navigate(`${router.current}/${dest}`, trigger);

    router.init = () => {
        hub.sub("app/route", ({ route }) => {
            if(!route)
                return;

            router.navigate(route, false);
        });
        locationBar.start({ pushState: true });
    };

    return router;
});
