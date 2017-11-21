define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("attr/type");

    exports.getByName = function(name) {
        return exports.get({name: name});
    };

    exports.getByLabel = function(label) {
        return exports.get({label: label});
    };

    exports.getAll = function() {
        return exports.get();
    };

    return exports;
});
