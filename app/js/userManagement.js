define(["jquery", "app/dal", "app/router", "app/viewManager", "app/hub","app/util","app/session","app/renderer", "app/user", "app/userManagementTable", "app/permissionEvaluator"],
function($, dal, Router, ViewManager, hub, util, Session, Renderer, User, UserManagementTable, permEval) {
    var userManagementTable;
    var createButton;

    const render = async function() {
        await ViewManager.renderView("userManagement");

        createButton = $("#create");
        const rowClickFunc = function(row, data) {
            row.click(() =>
                Router.navigate(`userProfile/${data.id}`, true));
        };

        createButton.click(() =>
            Router.navigate("userManagement/new", true));

        const users = await dal.get(`user?mpId=${MX.session.creds.user.mp.id}`);

        const nonAdmins = users.filter(user =>
            !permEval.isMXAdmin(user));

        userManagementTable = new UserManagementTable($("#usersTable"), nonAdmins, rowClickFunc);
        userManagementTable.render();
    };

    hub.sub("app/route/userManagement", function(e) {
        var path = e.dest.split('/').slice(2);
        switch(path.length) {
        case 1:
            if(path[0] == "userManagement")
                render();
            break;
        case 2:
            if(path[1] == "new") {
                const control = new User({
                    mp: MX.session.creds.user.mp,
                    perms: [] });

                control.render();
            }

            break;
        }
    });
});
