define(["jquery", "app/util", "app/viewManager", "app/attributeSelector", "moment",
    "app/dal", "app/hub", "app/dateRange", "app/spinner", "app/marketViewerTable", "app/queryControl",
    "app/noty", "app/util/render"],
function($, util, ViewManager, AttributeSelector, moment, dal, hub, DateRange, Spinner,
MarketViewerTable, QueryControl, Noty, RenderUtil) {
    const marketViewer = {};

    const render = function() {
        ViewManager.renderView("marketViewer").then(onRender);
    };

    const onRender = async () => {
        marketViewer.queryControl = new QueryControl($("#marketViewerFilters"), {}, {
            dateTemplate: "catalogViewerDateRange",
            wholeAttributes: false,
            revealMarketsDropdown: true,
            revealImpressionCount: true
        }, "attr");

        await marketViewer.queryControl.render();

        $("#find").removeClass("hidden");
        $("#reset").removeClass("hidden");
        $("#role").removeClass("hidden");

        $("#find").click(onFind);

        $("#reset").click(() => {
            marketViewer.queryControl.resetSelectors();
            $("#results").addClass("hidden");
        });
    };

    const onFind = async () => {
        Noty.closeAll();

        $("#results").addClass("hidden");
        $("#msg").empty();

        const errors = marketViewer.queryControl.validate();
        if(errors.length > 0) {
            util.displayErrors(errors);
            return;
        }

        Noty.closeAll();

        Spinner.add($("#marketViewerFilters"));

        const spinQuery = RenderUtil.createActionSpinner($("#marketViewerFilters"));

        const queryParams = marketViewer.queryControl.getData();
        queryParams.role = $("input[name=role]:checked", "#role").val();

        const [aparAsks, aparBids, asarAsks, asarBids] = await spinQuery(() =>
            Promise.all(util.flatten(
                ["apar", "asar"].map(component =>
                    ["ask", "bid"].map(order =>
                        `${component}/${order}`)))
                .map(submitQuery(queryParams))));

        $("#results").removeClass("hidden");

        const aparAskTable = new MarketViewerTable(aparAsks, "apar", $("#APARAsks"));
        const aparBidTable = new MarketViewerTable(aparBids, "apar", $("#APARBids"));

        const asarAskTable = new MarketViewerTable(asarAsks, "asar", $("#ASARAsks"));
        const asarBidTable = new MarketViewerTable(asarBids, "asar", $("#ASARBids"));

        return Promise.all([
            aparAskTable.render(),
            aparBidTable.render(),

            asarAskTable.render(),
            asarBidTable.render()]);
    };

    const submitQuery = query => destination =>
        dal.get(`market/${query.marketId
            ? `${query.marketId}/`
            : ""
        }${destination}`, query);

    hub.sub("app/route/marketViewer", render);
});
