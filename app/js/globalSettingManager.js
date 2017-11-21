define([ "app/hub", "app/router", "app/settingManager"],
function(hub, Router, SettingManager) {
    hub.sub("app/route/globalSettingManager", async function(e) {
        Router.navigate("globalSettingManager/", false);
        const control = new SettingManager(true);

        await control.init();
        return control.render();
    });
});
