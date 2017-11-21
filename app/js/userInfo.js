define(["jquery", "app/hub", "app/router", "app/renderer", "app/session"], function($, hub, Router, Renderer, Session) {
    var exports = {};

    exports.render = async function(container) {
        const renderer = new Renderer(container);
        await renderer.renderTemplate("userInfo", MX.session.creds, true);

        $("#displayName").click(() =>
            Router.navigate(`userProfile/${MX.session.creds.user.id}`, true));

        $("#mpProfileLink").click(() =>
            Router.navigate(`mpProfile/${MX.session.creds.user.mp.id}`, true));

        $("#logout").click(
            Session.destroy);

        //set up admin actions
        if(MX.session.creds.user.perms
            .some(perm =>
                ["ROLE_MP_ADMIN", "ROLE_MX_ADMIN"]
                    .includes(perm.permission.authority)))
        {
            $("#userManagementLink").click(() =>
                Router.navigate("userManagement", true));

            $("#userManagementLink").css("display", "block");

            $("#rateCardDefaultManagerLink").click(() =>
                Router.navigate("rateCardDefaultManager", true));

            $("#rateCardDefaultManagerLink").css("display", "block");

            $("#marketParticipantSettingManagerLink").click(() =>
                Router.navigate("marketParticipantSettingManager", true));

            $("#marketParticipantSettingManagerLink").css("display", "block");
        }
    };

    return exports;
});
