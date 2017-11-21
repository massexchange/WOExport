define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("campaign");

    exports.getForMp = function(mp) {
        return exports.get({ mpId: mp.id });
    };
    
    return exports;
});
