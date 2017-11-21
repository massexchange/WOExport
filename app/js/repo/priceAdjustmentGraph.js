define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("graph");

    exports.getAll = function() {
        return exports.get();
    };
    
    return exports;
});
