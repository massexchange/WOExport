define(["app/hub", "app/repo"], function(hub, Repo) {
    var exports = new Repo("rateCard");

    exports.getForMp = function(mp) {
        return exports.get({ mpId: mp.id });
    };

    exports.getForSourceAndMp = function(keyId, mp) {
        return exports.get({
            keyId: keyId
        });
    };
    
    return exports;
});
