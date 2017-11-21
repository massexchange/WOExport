define(["app/hub", "app/repo", "app/util"], function(hub, Repo, util) {
    var exports = new Repo("acquisition/import");

    exports.getForMp = function(mp) {
        return exports.get({ mpId: mp.id });
    };

    return exports;
});
