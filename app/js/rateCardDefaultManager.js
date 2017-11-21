define(["jquery", "app/util", "app/hub", "app/viewManager", "app/repo/attr", "app/router",
"app/rateCardDefault", "app/table"],
function($, util, hub, ViewManager, AttributeRepo, Router, RateCardDefault, Table) {
    var promises = {};

    var init = function() {
        return promises.mediaTypesP = AttributeRepo.get({typeName: "MediaType"});
    };

    var render = async function() {
        const [el, mediaTypes] = await Promise.all([
            ViewManager.renderView("rateCardDefaultManager"),
            promises.mediaTypesP]);

        var table = new Table($("#mediaTypeTable"), mediaTypes, createColumnsObject(), true);
        return table.render(rowFunc);
    };

    var createColumnsObject = function() {
        return [
            {
                name: "",
                accessor: (type) => type.value,
                type: "string"
            }
        ];
    };

    var rowFunc = function(row, mediaType) {
        row.click(async () => {
            Router.navigate(`rateCardDefaultManager/${mediaType.value}`, false);
            var control = new RateCardDefault(mediaType);
            control.setRenderer(ViewManager);

            await control.init();
            control.render();
        });
    };

    hub.sub("app/route/rateCardDefaultManager", function(e) {
        var path = e.dest.split('/').slice(3).filter((ch) => ch != "");
        init();
        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            promises.mediaTypesP.then(async mediaTypes => {
                var possibleTargets = mediaTypes.filter(mt => mt.value == path[0]);
                if(possibleTargets.length > 0) {
                    const control = new RateCardDefault(possibleTargets[0]);
                    control.setRenderer(ViewManager);

                    await control.init();
                    control.render();
                } else
                    Router.navigate("rateCardDefaultManager/", true);
            });
            break;
        default:
            Router.navigate("rateCardDefaultManager/", true);
        }
    });
});
