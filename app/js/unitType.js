define(["jquery", "app/dal", "app/router", "app/viewManager", "app/hub", "app/util", "app/session", "app/renderer", "app/table", "app/repo/unitType", "app/repo/attrType",
    "app/dropdown", "app/noty"],
function($, dal, Router, ViewManager, hub, util, Session, Renderer, Table, UnitTypeRepo, AttrTypeRepo, Dropdown, Noty) {
    return class UnitType {
        constructor(unitType) {
            this.model = unitType;
            this.promises = {};
            this.elements = {};

            this.childDropdownText = MX.strings.get("unitType_childDropdownText");
            this.attrTypeDropdownText = MX.strings.get("unitType_attrTypeDropdownText");
            this.unitTypeDropdownText = MX.strings.get("unitType_unitTypeDropdownText");
            this.newHeaderTitle = MX.strings.get("unitType_newHeaderTitle");
            this.emptyShortNameError = MX.strings.get("unitType_error_emptyShortName");
            this.emptyLongNameError = MX.strings.get("unitType_error_emptyLongName");
            this.circularRefError = MX.strings.get("unitType_error_circRef");
            this.renameUAError = MX.strings.get("unitType_error_renameUA");
            this.savedMsg = MX.strings.get("unitType_saved");
        }
        setRenderer(rend) {
            this.renderer = rend;
        }
        init() {
            this.promises.unitTypesP = UnitTypeRepo.getAll();
            this.promises.attrTypesP = AttrTypeRepo.getAll();

            return Promise.all([
                this.promises.unitTypesP,
                this.promises.attrTypesP]);
        }
        populateTextFields() {
            this.elements.shortName.val(this.model.shortName);
            this.elements.longName.val(this.model.longName);
        }
        async render() {
            await this.renderer.renderTemplate("unitType");

            this.elements.unitTypeDD = $("#unitTypeDD");
            this.elements.attrTypeDD = $("#attrTypeDD");
            this.elements.attrTypeTable = $("#attrTypeTable");
            this.elements.addAttrType = $("#addAttrType");
            this.elements.shortName = $("#shortName");
            this.elements.longName = $("#longName");
            this.elements.save = $("#save");
            this.elements.delete = $("#deleteButton");
            this.elements.response = $("#response");

            this.renderPromises = [];

            this.populateTextFields();

            this.elements.delete.prop("disabled", !this.model.id);

            this.elements.save.click(() => this.save());

            //delete button
            if(!(this.model.shortName && this.model.shortName == "UA"))
                this.elements.delete.click(() => this.unitTypeDeleteButtonClickHandler());

            //disable things for new/UA
            if(!this.model.id || (this.model.shortName && this.model.shortName == "UA")) {
                this.elements.delete.addClass("hidden");
                this.elements.delete.prop("disabled", true);
            }
            if(this.model.shortName && this.model.shortName == "UA") {
                this.elements.shortName.prop("disabled", true);
                this.elements.longName.prop("disabled", true);
            }

            this.renderPromises.push(
            this.promises.attrTypesP.then(types => {
                this.attrTypeTable = new Table(this.elements.attrTypeTable, this.model.attrTypes, this.createAttrTypeColumns());
                this.attrTypeTable.render(this.generateAttributeTypeRowDeleteClickHandler());

                this.attrTypeDD = new Dropdown(
                    types.filter(type =>
                        !this.model.attrTypes.some(at =>
                            at.id == type.id)),
                    {
                        container: this.elements.attrTypeDD,
                        promptText: this.attrTypeDropdownText,
                        textField: "name"
                    });
                this.attrTypeDD.render();
                this.elements.addAttrType.click(() =>
                    this.addAttrType());
            }));

            this.renderPromises.push(
            this.promises.unitTypesP.then(async uts => {
                this.uts = uts;

                if(this.model.id) {
                    this.unitTypeDD = new Dropdown(uts, {
                        container: this.elements.unitTypeDD,
                        promptText: this.unitTypeDropdownText,
                        textField: "longName"
                    });
                    await this.unitTypeDD.render();

                    if(this.model.id)
                        this.unitTypeDD.selectByVal(this.model.id);

                    this.unitTypeDD.change.subscribe(() =>
                        this.unitTypeDDOnChange());
                } else
                    $("#titleInfo > h1").text(this.newHeaderTitle);
            }));

            return Promise.all(this.renderPromises);
        }
        addAttrType() {
            if(!this.attrTypeDD.selected)
                return;

            const { item: AT, val } = this.attrTypeDD.selected;

            this.attrTypeTable.addItem(AT, this.generateAttributeTypeRowDeleteClickHandler());
            this.attrTypeDD.removeByVal(val);
        }
        async unitTypeDDOnChange() {
            Router.navigate(`unitTypeManagement/${this.unitTypeDD.selected.val}`, false);

            const control = new UnitType(this.unitTypeDD.selected.item);
            control.setRenderer(this.renderer);

            await control.init();
            control.render();
        }
        validate() {
            var valid = true;
            if(this.elements.shortName.val().trim().length == 0) {
                Noty.error(this.emptyShortNameError);
                valid = false;
            }
            if(this.elements.longName.val().trim().length == 0) {
                Noty.error(this.emptyLongNameError);
                valid = false;
            }
            return valid;
        }
        async save()  {
            this.elements.response.empty();
            //validate first
            if(!this.validate())
                return;

            //not allowed to rename UA or retype it
            if(this.model.shortName && this.model.shortName == "UA") {
                Noty.error(this.renameUAError);
                this.populateTextFields();
            }

            //prepare save version for final checks
            var savePass = {
                id: this.model.id,
                shortName: this.elements.shortName.val(),
                longName: this.elements.longName.val(),
                attrTypes: util.cloneSimple(this.attrTypeTable.model)
            };

            var isNew = !this.model.id;

            //we good to save
            const resp = await UnitTypeRepo.save(savePass);

            if(isNew)
                Router.navigate(`unitTypeManagement/${resp.id}`, true);

            this.model = resp;
            this.elements.delete.removeClass("hidden");

            Noty.success(this.savedMsg);
        }
        async unitTypeDeleteButtonClickHandler() {
            if(!this.model.id)
                return;

            await UnitTypeRepo.delete(this.model);
            Router.navigate("unitTypeManagement/", true);
        }
        createAttrTypeColumns() {
            return [
                {
                    name: "",
                    accessor: (at) => at.name,
                    type: "string"
                },
                {
                    name: "",
                    accessor: () => " ",
                    type: "removeButton"
                }
            ];
        }
        generateAttributeTypeRowDeleteClickHandler() {
            return (row, at) => {
                var deleteButton = row.find(".delete");
                deleteButton.removeClass("hidden");
                deleteButton.click(() => {
                    row.remove();
                    this.attrTypeTable.model = this.attrTypeTable.model
                        .filter(datum => datum.id != at.id);

                    this.attrTypeDD.addItem(at);
                });
            };
        }
    };
});
