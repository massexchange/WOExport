define(["jquery", "app/dal", "app/router", "app/viewManager", "app/hub", "app/util", "app/session",
"app/renderer", "app/table", "app/repo/unitType", "app/unitType"],
function($, dal, Router, ViewManager, hub, util, Session, Renderer, Table, UnitTypeRepo, UnitType) {

    
    var elements = {};
    var promises = {};

    var init = () => {
        promises.unitTypesP = UnitTypeRepo.getAll();
    };

    var createColumns = () => [{
        name: "",
        accessor: (ut) => ut.longName,
        type: "string"
    }];

    var unitTypeTableRowRoutingClickHandler = (row, ut) => {
        row.click(function() {
            Router.navigate("unitTypeManagement/" + ut.id, true);
        });
    };

    var newButtonHandler = () => {
        var blankUT = {
            id: null,
            shortName: "",
            longName: "",
            primaryAttrType: null,
            children: [],
            attrTypes: []
        };
        Router.navigate("unitTypeManagement/new", false);
        var control = new UnitType(blankUT);
        control.setRenderer(ViewManager);
        control.init().then(() => control.render());
    };

    var render = async () => {
        await ViewManager.renderView("unitTypeManagement");

        elements.unitTypeTable = $("#unitTypeTable");
        elements.response = $("#response");
        elements.newButton = $("#new");

        elements.newButton.click(newButtonHandler);

        const types = await promises.unitTypesP;

        const unitTypeTable = new Table(elements.unitTypeTable, types, createColumns(), true);
        return unitTypeTable.render(unitTypeTableRowRoutingClickHandler);
    };

    hub.sub("app/route/unitTypeManagement", (e) => {
        var path = e.dest.split("/").slice(3).filter((ch)=> ch != "");

        switch(path.length) {
        case 0:
            init();
            render();
            break;
        case 1:
            if(!Number.isInteger(parseInt(path[0]))) {
                Router.navigate("unitTypeManagement/", true);
                break;
            }
            UnitTypeRepo.getById(path[0]).then(async ut => {
                const control = new UnitType(ut);
                control.setRenderer(ViewManager);
                
                await control.init();
                control.render();
            });
            break;
        default:
            Router.navigate("unitTypeManagement/", true);
        }
    });
});
