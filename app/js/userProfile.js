define(["jquery", "app/dal", "app/viewManager", "app/hub", "app/util", "app/session", "app/user"],
function($, dal, ViewManager, hub, util, Session, User) {
    var render = function(user) {
        var control = new User(user);
        return control.render();
    };

    hub.sub("app/route/userProfile", function(e) {
        var path = e.dest.split("/").slice(3);
        switch(path.length) {
        case 0:
            render(MX.session.creds.user);
            break;
        case 1:
            dal.get(`user/${path[0]}`).then(render);
            break;
        }
    });
});
