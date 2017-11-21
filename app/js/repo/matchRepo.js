define(["app/util", "app/hub", "app/repo", "app/dal"], function(util, hub, Repo, dal) {
    var exports = new Repo("match");

    exports.getMatchSummaryDTOs = () => {
        return dal.get("match/summary");
    };

    return exports;
});
