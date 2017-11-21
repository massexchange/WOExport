// This repo is for the /attr endpoint.
// For /attr/deps, /attr/type, or /attr/type/deps, it might be more appropriate to use
// repo/attrDeps.js, repo/attrType.js, or repo/attrTypeDeps.js, respectively.
define(["app/hub", "app/dal", "app/repo", "app/util"], 
function(hub, dal, Repo, util) {

    var exports = new Repo("attr");

    

    var endpointBase = "attr";

    // This overrides get() in repo.js
    // Example usages:
    // AttrRepo.get({ id: foo })
    // AttrRepo.get({ typeId: bar })
    // AttrRepo.get({ typeName: "baz" })
    // AttrRepo.get()
    exports.get = function(query) {
        var opts = query ? query : {};

        if (util.isDefined(opts.id)) {
            return dal.get(endpointBase, { id: opts.id });
        } else if (util.isDefined(opts.typeId)) {
            return dal.get(endpointBase, { typeId: opts.typeId });
        } else if (util.isDefined(opts.typeName)) {
            return dal.get(endpointBase, { typeName: opts.typeName });
        } else {
            return dal.get(endpointBase, {});
        }
    };

    // put(), post(), and delete() are inherited from repo.js
    return exports;
        
});
