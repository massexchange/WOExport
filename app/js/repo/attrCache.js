// TODO: name this attrCache, attributeCache, or attribute?
// ie how broad a class and how decoupled a name?
define(["app/hub", "app/dal", "app/repo", "app/util"],
function(hub, dal, Repo, util) {
    var exports = new Repo("attrCache");

    // This overrides get() in repo.js
    // Example usage:
    // var dmaPromise = attrCacheRepo.get({ mpId: user.mp.id, typeName: "DMA" });
    exports.get = function(query, path = "") {
        return dal.get(exports.base + path, query);
    };

    exports.getAttributes = async function(type) {
        try {
            const { attributes } = await exports.get({ typeName: type });
            return attributes;
        } catch(error) {
            return [];
        }
    };

    exports.regen = function(mpId) {
        return dal.get(`${exports.base}/regenerated`, { mpId });
    };

    return exports;
});
