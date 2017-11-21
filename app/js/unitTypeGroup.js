define(["jquery", "app/dal", "app/router", "app/table", "app/util", "app/repo/unitType",
"app/repo/attrType", "app/dropdown", "app/repo/marketParticipantUnitTypeGroup", "app/repo/defaultUnitTypeGroup",
"app/noty"],
function($, dal, Router, Table, util, UnitTypeRepo, AttrTypeRepo, Dropdown, MarketParticipantUnitTypeGroupRepo,
    DefaultUnitTypeGroupRepo, Noty) {
        var columns = [
            {
                name: "",
                accessor: (ut) => ut.longName,
                type: "string"
            },
            {
                name: "",
                accessor: () => " ",
                type: "removeButton"
            }
        ];

    return class UnitTypeGroup {
        constructor(unitTypeGroup, root, isDefault = false) {
            this.model = unitTypeGroup;
            this.isDefault = isDefault;
            this.promises = {};
            this.elements = {};
            this.root = root;
            this.repo = isDefault
                ? DefaultUnitTypeGroupRepo
                : MarketParticipantUnitTypeGroupRepo;

            this.strings = {};
            this.strings.defaultTitle = MX.strings.get("unitTypeGroup_defaultTitle");
            this.strings.attrTypeDDPrompt = MX.strings.get("unitTypeGroup_attrTypeDDPrompt");
            this.strings.unitTypeDDPrompt = MX.strings.get("unitTypeGroup_unitTypeDDPrompt");
            this.strings.newTitle = MX.strings.get("unitTypeGroup_newTitle");
            this.strings.missingAttributeType = MX.strings.get("unitTypeGroup_error_missingAttributeType");
            this.strings.saved = MX.strings.get("unitTypeGroup_saved");
        }
        setRenderer(rend) {
            this.renderer = rend;
        }
        init() {
            this.promises.unitTypesP = UnitTypeRepo.getAll();
            this.promises.attrTypesP = AttrTypeRepo.getAll();
            this.promises.unitTypeGroupsP = (this.isDefault ?
                DefaultUnitTypeGroupRepo :
                MarketParticipantUnitTypeGroupRepo).getAll();

            return Promise.all([
                this.promises.unitTypesP,
                this.promises.attrTypesP,
                this.promises.unitTypeGroupsP]);
        }
        async render() {
            await this.renderer.renderTemplate("unitTypeGroup");

            this.elements.unitTypeGroupDD = $("#unitTypeGroupDD");
            this.elements.unitTypeDD = $("#unitTypeDD");
            this.elements.attrTypeDD = $("#attrTypeDD");
            this.elements.addButton = $("#addButton");
            this.elements.deleteButton = $("#deleteButton");
            this.elements.save = $("#save");
            this.elements.response = $("#response");
            this.elements.unitTypeTable = $("#unitTypeTable");

            if(this.isDefault)
                $("#titleInfo > h1").text(this.strings.defaultTitle);

            this.renderPromises = [];

            this.elements.save.click(this.save.bind(this));

            this.unitTypeTable = new Table(this.elements.unitTypeTable, this.model.unitTypes, columns);
            this.unitTypeTable.render(this.tableRowDeleteClickHandler.bind(this));

            if(!this.model.id)
                this.elements.deleteButton.addClass("hidden");
            else
                this.elements.deleteButton.click(() =>
                    this.repo.delete(this.model)
                    .then(() => Router.navigate(this.root, true))
                    .catch(this.displayResponse)
                );

            this.renderPromises.push(
            this.promises.attrTypesP.then(async types => {
                this.attrTypeDD = new Dropdown(types, {
                    container: this.elements.attrTypeDD,
                    promptText: this.strings.attrTypeDDPrompt,
                    textField: "name"
                });
                await this.attrTypeDD.render();
                if(this.model.groupingAttributeType && this.model.groupingAttributeType.id)
                    this.attrTypeDD.selectByVal(this.model.groupingAttributeType.id);
            }));

            this.renderPromises.push(
            this.promises.unitTypesP.then(uts => {
                uts = uts.filter(ut =>
                    !this.model.unitTypes.some(mut =>
                        mut.id == ut.id));

                this.unitTypeDD = new Dropdown(uts, {
                    container: this.elements.unitTypeDD,
                    promptText: this.strings.unitTypeDDPrompt,
                    textField: "longName"
                });
                this.elements.addButton.click(this.addUnitType.bind(this));
                return this.unitTypeDD.render();
            }));

            if(this.model.id)
                this.renderPromises.push(
                this.promises.unitTypeGroupsP.then(async utgs => {
                    this.unitTypeGroupDD = new Dropdown(utgs, {
                        container: this.elements.unitTypeGroupDD,
                        textField: "groupingAttributeType.name"
                    });
                    await this.unitTypeGroupDD.render();

                    this.unitTypeGroupDD.selectByVal(this.model.id);
                    this.unitTypeGroupDD.change.subscribe(() =>
                        this.unitTypeGroupDDChangeHandler());
                }));
            else
                $("#titleInfo > h1").text(this.strings.newTitle(this.isDefault));

            return Promise.all(this.renderPromises);
        }
        tableRowDeleteClickHandler(row, ut) {
            row.find(".delete")
                .removeClass("hidden")
                .click(() => {
                    row.remove();

                    this.unitTypeTable.model = this.unitTypeTable.model.filter(unitType =>
                        unitType.id != ut.id);

                    this.model.unitTypes = this.model.unitTypes.filter(unitType =>
                        unitType.id != ut.id);

                    this.unitTypeDD.addItem(ut);
                });
        }
        isValid() {
            var valid = true;
            var error = msg => this.elements.response.append(
                $("<div>").addClass("error").html(msg));

            if(!this.attrTypeDD.selected.item || this.attrTypeDD.selected.val < 1) {
                error(this.strings.missingAttributeType);
                valid = false;
            }

            return valid;
        }
        async save() {
            if(!this.isValid())
                return;

            const saveVersion = {
                id: this.model.id,
                groupingAttributeType: this.attrTypeDD.selected.item,
                unitTypes: this.unitTypeTable.model
            };

            const isNew = !this.model.id;

            const resp = await (this.isDefault
                ? DefaultUnitTypeGroupRepo
                : MarketParticipantUnitTypeGroupRepo
            ).save(saveVersion);

            if(isNew)
                Router.navigate(this.root + resp.id, true);

            this.model = resp;
            this.elements.deleteButton.removeClass("hidden");

            Noty.success(this.strings.saved);
        }
        addUnitType() {
            const { item: ut, val } = this.unitTypeDD.selected;

            if(!ut || val < 1)
                return;

            this.unitTypeTable.addItem(ut, this.tableRowDeleteClickHandler.bind(this));
            this.unitTypeDD.removeByVal(val);
        }
        async unitTypeGroupDDChangeHandler() {
            Router.navigate(this.root + this.unitTypeGroupDD.selected.val, false);

            var control = new UnitTypeGroup(this.unitTypeGroupDD.selected.item, this.isDefault);
            control.setRenderer(this.renderer);

            await control.init();
            control.render();
        }
    };
});
