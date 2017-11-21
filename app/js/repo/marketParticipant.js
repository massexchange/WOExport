define(["app/hub", "app/repo", "app/util"], function(hub, Repo, util) {
    var exports = new Repo("mp");

    exports.getMarkets = util.partialRight(exports.getSubCollection, "markets");

    exports.getByRole = function(role) {
        return exports.get({ role });
    };
    
    return exports;
});
