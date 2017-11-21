define(["app/hub", "app/repo", "app/util", "app/permissionEvaluator"], function(hub, Repo, util, PermEval) {
    var exports = new Repo("team");

    var getQueryingByFieldId = function(field) {
        return function(x) {
            return exports.get({ [field + "Id"]: util.idSelector(x) });
        };
    };

    exports.getForUser = getQueryingByFieldId("user");
    exports.getForMp = getQueryingByFieldId("mp");

    exports.getOwn = util.piecewise(
        util.or(
            PermEval.isMPAdmin,
            PermEval.isMXAdmin
        ), {
        true: util.compose(
                  exports.getForMp,
                  util.selectorFor("mp")
              ),
        false: exports.getForUser
    });

    return exports;
});
