define(["app/hub", "app/repo", "app/util", "app/dal"], function(hub, Repo, util, dal) {
    var exports = new Repo("unitType");

    exports.getByType = function(type) {
        return exports.get({ primaryAttributeTypeId: type.id });
    };

    exports.getById = function(id) {
        return dal.get(`unitType/${id}`);
    };

    exports.getByMediaType = function(mediaType) {
        return exports.get({ mediaTypeId: mediaType.id });
    };

    exports.getAll = function() {
        return exports.get();
    };

    return exports;
});
