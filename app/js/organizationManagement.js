define(["jquery", "app/dal", "app/viewManager", "app/hub", "app/util", "app/session", "app/renderer",
    "app/mp", "app/mpManagementTable", "app/router"],
function($, dal, ViewManager, hub, util, Session, Renderer, MP, MPManagementTable, Router) {


    var createButton;
    var activeTable;
    var inactiveTable;

    var render = async function() {
        await ViewManager.renderView("organizationManagement");

        createButton = $("#create")
            .click(() => {
                Router.navigate("organizationManagement/new", false);
                const control = new MP({ status: "Active" });

                control.setRenderer(ViewManager);
                control.render();
            });

        const organizations = await dal.get("mp");
        const rowClickFunc = function(row, data) {
            row.click(function() {
                Router.navigate(`mpProfile/${data.id}`, true);
            });
            row.addClass("clickable");
        };

        const actives = organizations.filter(mp =>
            mp.status == "Active");

        const inactives = organizations.filter(mp =>
            mp.status == "Inactive");

        activeTable = new MPManagementTable($("#activeTable"), actives, rowClickFunc);
        activeTable.render();

        inactiveTable = new MPManagementTable($("#inactiveTable"), inactives, rowClickFunc);
        inactiveTable.render();
    };

    hub.sub("app/route/organizationManagement", function(e) {
        render();
    });
});
