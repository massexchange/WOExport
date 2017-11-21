define(["app/hub", "app/repo", "app/util", "app/permissionEvaluator", "app/da;=l"], function(hub, Repo, util, PermEval, dal) {
    var exports = new Repo("market");

    exports.submitOrderGroup = function(market, group) {
        return dal.post(`${exports.base}/${market.id}/orders/group`, group.id);
    };

    return exports;
});
