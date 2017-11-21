define(["jquery", "app/dal", "app/router", "app/viewManager", "app/hub", "app/util", "app/session",
"app/renderer", "app/table", "app/unitTypeGroup", "app/repo/marketParticipantUnitTypeGroup",
"app/repo/defaultUnitTypeGroup"],
function($, dal, Router, ViewManager, hub, util, Session, Renderer, Table, UnitTypeGroup,
    MarketParticipantUnitTypeGroupRepo, DefaultUnitTypeGroupRepo) {
    return class UnitTypeGroupManagement {
        constructor(isDefault = false) {
            this.isDefault = isDefault;
            this.elements = {};
            this.promises = {};

            this.repo = isDefault
                ? DefaultUnitTypeGroupRepo
                : MarketParticipantUnitTypeGroupRepo;

            this.columnsObject = [{
                name: "",
                accessor: (utg) => utg.groupingAttributeType.name,
                type: "string"
            }];
            this.rootUrl = `${isDefault
                ? "default"
                : "marketParticipant"
            }UnitTypeGroupManagement`;

            this.strings = {};
            this.strings.defaultTitle = MX.strings.get("unitTypeGroup_defaultTitle");

            hub.sub(`app/route/${this.rootUrl}`, (e) => {
                var path = e.dest.split("/").slice(3).filter((ch)=> ch != "");

                switch(path.length) {
                case 0:
                    this.init();
                    this.render();
                    break;
                case 1:
                    if(!Number.isInteger(parseInt(path[0]))) {
                        Router.navigate(this.rootUrl, true);
                        break;
                    }
                    this.repo.getById(path[0]).then((utg) => {
                        var control = new UnitTypeGroup(utg, this.rootUrl, this.isDefault);
                        control.setRenderer(ViewManager);
                        control.init().then(() => control.render());
                    });
                    break;
                default:
                    Router.navigate(this.rootUrl, true);
                }
            });
        }
        init() {
            this.promises.unitTypeGroupsP = this.repo.getAll();
        }
        tableRowRoutingClickHandler(row, utg) {
            var func = function() {
                Router.navigate(`${this.rootUrl}/${utg.id}`, true);
            };
            row.click(func.bind(this));
        }
        async newButtonHandler() {
            var blankUTG = {
                id: null,
                groupingAttributeType: null,
                unitTypes: []
            };
            if(this.isDefault)
                blankUTG.mp = null;

            Router.navigate(`${this.rootUrl}/new`, false);
            const control = new UnitTypeGroup(blankUTG, this.rootUrl, this.isDefault);
            control.setRenderer(ViewManager);

            await control.init();
            return control.render();
        }
        async render() {
            await ViewManager.renderView("unitTypeGroupManagement");

            this.elements.unitTypeGroupTable = $("#unitTypeGroupTable");
            this.elements.response = $("#response");
            this.elements.newButton = $("#new");

            if(this.isDefault)
                $("#titleInfo > h1").text(this.strings.defaultTitle);

            this.elements.newButton.click(() => this.newButtonHandler());

            const groups = await this.promises.unitTypeGroupsP;

            var UnitTypeGroupTable = new Table(this.elements.unitTypeGroupTable, groups, this.columnsObject, true);
            return UnitTypeGroupTable.render(
                this.tableRowRoutingClickHandler.bind(this));
        }
    };
});
