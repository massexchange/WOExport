define(["require", "app/util", "jquery", "app/hub", "app/dal", "app/router", "cookies-js", "moment"],
function(require, util, $, hub, dal, Router, Cookies, moment) {
    var session = {};

    var renderLogin = function() {
        return new Promise((resolve, reject) => {
            require(["app/login"], function(login) {
                login.render().then(resolve);
            });
        });
    };

    var setCookie = function(creds) {
        var future = new Date();
        future.setDate(new Date().getDate() + 30);

        //Expire cookies 30 days from now. Also add "secure: true" once we enable SSL
        Cookies.set("auth", creds.token, { expires: future });
    };

    session.getCreds =  () => {
        return session.creds;
    };

    session.get = () => {
        if(session.creds)
            return session.creds;

        const promise = new Promise((resolve) =>
            hub.sub("app/auth/success", util.chain(
                util.setterFor(session, "creds"),
                setCookie,
                resolve
            )));

        renderLogin();

        return promise;
    };

    session.destroy = async () => {
        await dal.delete(`session/${session.creds.token}`);

        delete session.creds;
        Cookies.expire("auth");
        hub.reset("app/auth/success");

        window.location.reload();
        Router.navigate("/");
    };

    return session;
});
