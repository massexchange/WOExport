define(["jquery", "app/dal", "app/util", "app/router", "app/viewManager", "app/hub", "app/session", "app/rateCard",
"app/table", "app/dropdown", "app/repo/attrCache", "app/repo/unitType", "app/repo/rateCard", "app/repo/attrType", "app/permissionEvaluator"],
function($, dal, util, Router, ViewManager, hub, Session, RateCard, Table, Dropdown, AttrCacheRepo,
    UnitTypeRepo, RateCardRepo, AttrTypeRepo, permEval) {


    var promises = {};

    var init = function() {
        promises.sources = AttrTypeRepo.getByLabel("Source").then(async types => {
            const caches = await Promise.all(
                types.map(t =>
                    AttrCacheRepo.getAttributes(t.name)));

            return util.flatten(caches);
        });

        promises.rateCards = RateCardRepo.getForMp(MX.session.creds.user.mp);
        promises.adSize = AttrTypeRepo.getByName("AdSize");
        promises.adSizes = AttrCacheRepo.getAttributes("AdSize");
        promises.UAType = AttrTypeRepo.getByName("MediaType").then(type =>
            UnitTypeRepo.getByType(type));

        return promises.init = Promise.all([
            promises.rateCards,
            promises.adSize,
            promises.adSizes,
            promises.sources,
            promises.UAType]);
    };

    var render = async function() {
        const page = ViewManager.renderView("rateCardViewer");

        const [el, rateCards, adSize, adSizes, UAUnitType] = await Promise.all([page,
            promises.rateCards,
            promises.adSize,
            promises.adSizes,
            promises.UAType]);

        var cardTable = new Table($("#rateCardTable"), rateCards, createColumnsObject(), true);
        if(rateCards.length > 0)
            cardTable.render(rowFunc);
        else
            $("#rateCardTable").text(MX.strings.get("rcViewer_noRateCards"));

        const sources = await promises.sources;

        var createButton = $("#create");
        var keys = filterUsedSources(sources, rateCards);

        var ddKey = new Dropdown(keys, {
            container: $("#sourceDropdown"),
            promptText: "Choose a source",
            textField: "value"
        });

        if(permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD") && keys.length > 0) {
            createButton.removeClass("hidden");
            createButton.click(() => {
                $("#sourceDropdown").removeClass("hidden");
                ddKey.change.subscribe(async ({ item: source }) => {
                    Router.navigate("rateCardViewer/new", false);

                    const blank = await createNewBlankCard(
                        MX.session.creds.user.mp.id,
                        source,
                        adSize,
                        adSizes,
                        UAUnitType);

                    var control = new RateCard(blank);
                    control.setRenderer(ViewManager);
                    await control.init();
                    control.render();
                });
            });
        }

        return ddKey.render();
    };

    //auxillary function for creating the "columns" object array that table.js expects
    var createColumnsObject = function() {
        return [{
            name: "",
            accessor: card => card.keyAttribute.value,
            type: "string"
        }];
    };

    const createNewBlankCard = async function(mpId, source, adSize, adSizes, ua) {
        //initialize blank card
        const blank = {
            mp: {
                id: mpId
            },
            keyAttribute: source,
            rows: []
        };

        const types = await UnitTypeRepo.getByType(source.type);

        //create a row per unitType
        blank.rows = [...types.unitTypes, ...ua.unitTypes].map(unitType => {
            const row = {
                type: unitType,
                columns: []
            };

            //create a column per adsize
            row.columns = adSizes.map(size => ({
                adSize: size,
                price: 0.01
            }));

            //Add package column with null adsize
            const packageColumn = {
                adSize: null,
                price: 0.01
            };

            row.columns.push(packageColumn);

            return row;
        });

        return blank;
    };

    const filterUsedSources = function(publs, cards) {
        //store the sources for which there are rate cards
        const used = cards.map(card =>
            card.keyAttribute);

        return publs.filter(x =>
            !util.contains(used, util.idEq, x));
    };

    //navigation function upon click
    const rowFunc = function(row, card) {
        row.click(function() {
            Router.navigate(`rateCardViewer/${card.id}`, true);
        });
    };

    hub.sub("app/route/rateCardViewer", function(e) {
        var path = e.dest.split("/").slice(3).filter((ch) => ch != "");
        init();
        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            if(!Number.isInteger(parseInt(path[0]))) {
                Router.navigate("rateCardViewer/", true);
                break;
            }

            dal.get(`rateCard/${path[0]}`).then(async card => {
                const control = new RateCard(card);
                control.setRenderer(ViewManager);

                await control.init();
                control.render();
            });
            break;
        default:
            Router.navigate("rateCardViewer/", true);
        }
    });
});
