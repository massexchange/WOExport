define(["jquery", "app/util", "app/spinner", "app/hub", "app/viewManager", "app/session", "app/noty", "moment", "app/dal",
    "app/list", "app/pageControl", "app/repo/matchRepo", "app/matchSummaryRow"],
function($, util, Spinner, hub, ViewManager, Session, Noty, moment, dal, List, PageControl, MatchRepo, MatchSummaryRow) {
    var responseContainer;
    var resultContainer;
    var pageNavContainer;

    var noMatches = MX.strings.get("matchSummary_noMatches");

    const render = async function() {
        await ViewManager.renderView("matchSummaryViewer");

        responseContainer = $("#responseContainer");
        resultContainer = $("#results");
        pageNavContainer = $("#pageNav");

        return onRender();
    };

    const onRender = async function() {
        const summaries = await MatchRepo.getMatchSummaryDTOs();
        if(summaries.length == 0) {
            //if there aren't any unflighted matches, we're done
            resultContainer.empty();
            resultContainer.append(
                $("<div>").addClass("error").text(noMatches));
            return;
        }

        return renderSummaryTable(summaries);
    };

    const renderSummaryTable = function(summaries) {
        const pager = new PageControl({
            source: new PageControl.Frontend({
                pageSize: 5,
                items: summaries
            }),
            list: new List({
                container: resultContainer,
                constructor: MatchSummaryRow
            }),
            container: pageNavContainer
        });

        return pager.render();
    };

    hub.sub("app/route/matchSummary", render);
});
