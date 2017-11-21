define(["jquery", "app/dal", "app/viewManager", "app/hub", "app/util", "app/session", "app/renderer",
"app/table", "app/repo/attrType", "app/attributeType", "app/router"],
function($, dal, ViewManager, hub, util, Session, Renderer, Table, AttrTypeRepo, AttributeType, Router) {
    var elements = {};
    var promises = {};

    const init = () => {
        promises.typesP = AttrTypeRepo.getAll();
    };

    const render = async () => {
        await ViewManager.renderView("attributeTypeManagement");

        elements.attrTypeTable = $("#attrTypeTable");
        elements.response = $("#response");
        elements.newButton = $("#new");

        const types = await promises.typesP;

        const attrTypeTable = new Table(elements.attrTypeTable, types, createColumns(), true);
        attrTypeTable.render(rowFunc);

        elements.newButton.click(async () => {
            Router.navigate("attributeTypeManagement/new", false);

            const control = new AttributeType({
                id: null,
                name: "",
                component: null,
                labels: null
            });
            control.setRenderer(ViewManager);

            await control.init();
            control.render();
        });
    };

    const createColumns = () => [{
        name: "",
        accessor: (attrType) => attrType.name,
        type: "string"
    }];

    const rowFunc = (row, attrType) => {
        row.click(() =>
            Router.navigate(`attributeTypeManagement/${attrType.id}`, true));
    };

    hub.sub("app/route/attributeTypeManagement", (e) => {
        var path = e.dest.split('/').slice(3).filter((ch) => ch != "");
        init();

        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            if(!Number.isInteger(parseInt(path[0]))) {
                Router.navigate("attributeTypeManagement/", true);
                break;
            }

            dal.get(`attr/type/${path[0]}`).then(async attrType => {
                const control = new AttributeType(attrType);
                control.setRenderer(ViewManager);

                await control.init();
                control.render();
            });
            break;
        default:
            Router.navigate("attributeTypeManagement/", true);
        }
    });
});
