define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("attr/type/deps");

    exports.getAll = function() {
        return exports.get();
    };

    return exports;
});
