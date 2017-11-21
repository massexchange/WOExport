define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("attr/type/label");

    exports.getByName = function(name) {
        return exports.get({name});
    };

    exports.getAll = function() {
    	return exports.get();
    };

    return exports;
});