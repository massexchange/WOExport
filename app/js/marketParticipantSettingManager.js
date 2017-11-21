define(["app/hub", "app/router", "app/settingManager"],
function(hub, Router, SettingManager) {

    hub.sub("app/route/marketParticipantSettingManager", async function(e) {
        Router.navigate("marketParticipantSettingManager/", false);
        const control = new SettingManager();

        await control.init();
        return control.render();
    });
});
