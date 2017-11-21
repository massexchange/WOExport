define(["app/hub", "app/dal"], function(hub, dal) {
    return function(endpoint, options) {
        var exports = { base: endpoint };

        options = !options ? {} : options;

        exports.get = function(query, path) {
            var opts = query ? query : {};

            return dal.get(endpoint || exports.base, opts);
        };

        exports.getSubCollection = function(resource, collection, query) {
            return exports.get(query, [exports.base, resource.id, collection].join("/"));
        };

        exports.getOne = function(id) {
            return dal.get([exports.base, id].join("/"));
        };

        exports.save = function(resource) {
            if(options.preSave)
                resource = options.preSave(resource);

            if(resource.id)
                return dal.put(`${endpoint}/${resource.id}`, resource);

            return dal.post(endpoint, resource);
        };

        // Convenience functions for save().
        exports.put  = function(resource) { return exports.save(resource); };
        exports.post = function(resource) { return exports.save(resource); };

        exports.delete = function(resource) {
            return dal.delete(`${endpoint}/${resource.id}`);
        };

        return exports;
    };
});
