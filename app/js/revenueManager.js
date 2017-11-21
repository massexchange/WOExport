define(["jquery", "app/renderer", "app/util", "app/util/render", "app/viewManager", "app/hub", "app/dal",
    "app/dropdown", "app/priceAdjustmentGraph", "app/repo/priceAdjustmentGraph",
    "app/repo/attr", "app/repo/rateCard", "app/repo/unitType", "app/table", "app/permissionEvaluator",
    "app/repo/attrType", "app/unitType", "app/router"],
function($, Renderer, util, renderUtil, ViewManager, hub, dal, Dropdown, PriceAdjustmentGraph,
    PriceAdjustmentGraphRepo, AttrRepo, RateCardRepo, UnitTypeRepo, Table, permEval,
    AttrTypeRepo, UnitType, Router) {

    var promises = {};

    var noPAG = MX.strings.get("revMan_noPAG");
    var rcDropdownText = MX.strings.get("revMan_rcDropdownText");
    var graphDropdownText = MX.strings.get("revMan_graphDropdownText");

    var init = function() {
        promises.graphs = PriceAdjustmentGraphRepo.getAll();
        promises.cards = RateCardRepo.getForMp(MX.session.creds.user.mp);

        return promises.init = Promise.all([
            promises.graphs,
            promises.cards]);
    };

    var selectors = {
        RateCardTable: "#rateCardTable",
        RateCardDDContainer: "#rateCardDD",
        GraphsDDContainer: "#graphsDD span",
        CreateButton: "#create"
    };

    var controls = {
        RateCardTable: {},
        RateCardDD: {},
        GraphsDD: {}
    };

    //auxillary function for creating the "columns" object array that table.js expects
    var createColumnsObject = function() {
        return [{
            name: "",
            accessor: card => card.keyAttribute.value,
            type: "string"
        }];
    };

    //navigation function upon click
    var rowFunc = function(row, card) {
        row.click(() =>
            Router.navigate(`revenueManager/${card.graphId}`));
    };

    const showGraph = async function(graph, onSave) {
        const graphControl = new PriceAdjustmentGraph(graph, {
            onSave,
            container: $("#priceGraph")
        });

        $("#rateCards").addClass("hidden");
        $("#graphsDD").removeClass("hidden");
        await graphControl.render();

        controls.GraphsDD.selectByVal(graph.id, false);
    };

    //auxilary function for newGraph
    //as per instructions, assume the same linear model for now, will break if lied to
    var createDaySliders = function(types) {
        return types.sort(util.comparator.unitType).map((ut,i) => {
            return {
                type: ut,
                day: 30 - i * 5
            };
        });
    };

    const initControls = async function(elements) {
        const initRateCardsTable = function(cards, graphs) {
            const newGraph = async card => {
                const type = await AttrTypeRepo.getByName("MediaType");
                const mediaUTypes = await UnitTypeRepo.getByType(type);
                const types = await UnitTypeRepo.getByType(card.keyAttribute.type);

                //generate sliders with initial values
                var daySliders = createDaySliders([
                    ...types.unitTypes,
                    ...mediaUTypes.unitTypes
                ]);

                var graph = {
                    mp: MX.session.creds.user.mp,
                    rateCard: card,
                    sliders: daySliders
                };

                return showGraph(graph, savedGraph =>
                    Router.navigate(`revenueManager/${savedGraph.id}`));
            };

            var usedCards = cards.map((card) => {
                var possibleGraphs = graphs.filter(util.fieldIdEqTo("rateCard",card));
                card.graphId = possibleGraphs.length != 0 ? possibleGraphs[0].id : 0;
                return card;
            }).filter((card) => card.graphId != 0);

            if(usedCards.length > 0) {
                controls.RateCardTable = new Table(elements.RateCardTable, usedCards, createColumnsObject(), true);
                controls.RateCardTable.render(rowFunc);
            } else
                $("#rateCardTable").text(noPAG);

            if(permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD"))
                elements.CreateButton.removeClass("hidden").click(function() {
                    elements.RateCardDDContainer.removeClass("hidden");
                    controls.RateCardDD.change.subscribe(({ item: card }) => {
                        Router.navigate("revenueManager/new", false);

                        elements.GraphsDDContainer.html(card.keyAttribute.value);

                        newGraph(card);
                    });
                });
        };

        var initDDs = function(cards, graphs) {
            var unusedCards = cards.filter(card =>
                graphs.filter(util.fieldIdEqTo("rateCard", card)).length == 0);

            controls.RateCardDD = new Dropdown(unusedCards, {
                container: elements.RateCardDDContainer,
                promptText: rcDropdownText,
                textField:  "keyAttribute.value"
            });

            controls.GraphsDD = new Dropdown(graphs, {
                container: elements.GraphsDDContainer,
                promptText: graphDropdownText,
                textField:  "rateCard.keyAttribute.value"
            });

            controls.GraphsDD.change.subscribe(({ val }) =>
                Router.navigate(`revenueManager/${val}`));

            return Promise.all([
                controls.RateCardDD.render(),
                controls.GraphsDD.render()]);
        };

        const [cards, graphs] = await Promise.all([promises.cards, promises.graphs]);

        return Promise.all([
            initDDs(cards, graphs),
            initRateCardsTable(cards, graphs)]);
    };

    var render = async function() {
        await ViewManager.renderView("revenueManager");

        const res = await dal.get("settings", { name: "RevenueManager" });

        if(res.value)
            return initControls(renderUtil.selectElements(selectors));

        var table = $("#rateCards");
        table.empty();
        table.text("Revenue Manager not available");
    };

    hub.sub("app/route/revenueManager", function(e) {
        var path = e.dest.split('/').slice(3).filter((ch) => ch != "");
        init();
        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            if(!Number.isInteger(parseInt(path[0])))
            {
                Router.navigate("revenueManager");
                break;
            }

            init().then(() => {
                var renderP = render();
                Promise.all([renderP, promises.cards, promises.graphs]).then(([rendered, cards, graphs]) => {
                    var graph = graphs.filter((g) => g.id == path[0])[0];
                    showGraph(graph);
                });
            });
            break;
        default:
            Router.navigate("revenueManager");
        }
    });
});
