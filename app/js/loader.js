define(["require", "app/hub"], function(require, hub) {
    var loaded = {};

    hub.sub("app/route", ({ route: modName }) => {
        if(modName.length == 0 || loaded[modName])
            return;

        const loadedSuccessfully = () => loaded[modName] = true;

        require([`app/${modName}`],
            loadedSuccessfully,
            ({ stack, requireMap, requireType, requireModules: [path] }) => {
                if(stack && requireType != "scripterror")
                    throw new Error(`${requireType != "timeout" ? `${requireMap.id}: ` : ""}${stack}`);
                if(requireType == "scripterror")
                    //look for an index.js one level down
                    require([`${path}/index`],
                        loadedSuccessfully,
                        ({ stack, requireMap, requireType, requireModules: [path] }) => {
                            if(stack && requireType != "scripterror")
                                throw new Error(`${requireMap.id}: ${stack}`);

                            if(requireType == "scripterror")
                                //fallback to legacy behavior, load the root module
                                require([`${path.split('/').slice(0,2).join('/')}`],
                                    loadedSuccessfully);
                        });
            });
    });
});
