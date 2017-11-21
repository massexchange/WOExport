define(["jquery", "app/renderer", "app/dal", "app/hub", "app/noty"],
function($, Renderer, dal, hub, Noty) {
    const exports = {};

    exports.render = async function() {
        const renderer = new Renderer($("#wrapper"));
        await renderer.render("login");

        $("#login-form").submit(() => {
            const username = $("#txtUser").val();
            const password = $("#txtPass").val();

            dal.post("session", { username, password }).then(res => {
                Noty.success(`Welcome, ${res.user.firstName}!`);
                hub.pub("app/auth/success", res);
            }).catch((errors) =>
                Noty.error(MX.strings.get("login_incorrect"), 3000));

            return false;
        });
    };

    return exports;
});
