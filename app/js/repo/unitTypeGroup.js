define(["app/hub", "app/repo", "app/dal"], function(hub, Repo, dal) {
    return function(isDefault = false) {
        var root = `unitType/group${isDefault ? "/default" : ""}`;
        var exports = new Repo(root);

        exports.getById = function(id) {
            return dal.get(`${root}/${id}`);
        };

        exports.getAll = function() {
            return exports.get();
        };

        return exports;
    };
});
