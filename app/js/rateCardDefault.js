define(["jquery", "app/dal", "app/router", "app/util", "app/repo/unitType", "app/table",
"app/dropdown", "app/repo/marketParticipantUnitTypeGroup", "app/repo/attr", "app/noty"],
function($, dal, Router, util, UnitTypeRepo, Table, Dropdown, MarketParticipantUnitTypeGroupRepo,
AttributeRepo, Noty) {
    var columns = [
        {
            name: "",
            accessor: ut => ut.longName,
            type: "string"
        },
        {
            name: "",
            accessor: () => " ",
            type: "removeButton"
        }
    ];

    return class RateCardDefault {
        constructor(mediaType) {
            this.promises = {};
            this.elements = {};
            this.mediaType = mediaType;

            this.strings = {};
            this.strings.noDefault = MX.strings.get("rateCardDefault_noDefault");
            this.strings.rateCardDDPrompt = MX.strings.get("rateCardDefault_rateCardDDPrompt");
            this.strings.unitTypeDDPrompt = MX.strings.get("rateCardDefault_unitTypeDDPrompt");
            this.strings.saved = MX.strings.get("rateCardDefault_saved");
            this.strings.emptTable = MX.strings.get("rateCardDefault_emptyTable");
        }

        setRenderer(rend) {
            this.renderer = rend;
        }

        init() {
            this.promises.unitTypesP = UnitTypeRepo.getAll();
            this.promises.mediaTypesP = AttributeRepo.get({typeName: "MediaType"});
            this.promises.unitTypeGroupsP = UnitTypeRepo.getByMediaType(this.mediaType)
                .then(unitTypeGroups => {
                    this.mediaTypeGroup = unitTypeGroups.filter(group =>
                        group.groupingAttributeType.name == "MediaType")[0];

                    this.sourceTypeGroup = unitTypeGroups.filter(group =>
                        group.groupingAttributeType.labels.some(label => label.value == "Source"))[0];

                    const otherGroups = unitTypeGroups
                        .filter(group =>
                            group.groupingAttributeType.name != "MediaType")
                        .filter(group =>
                            !group.groupingAttributeType.labels.some(label =>
                                label.value == "Source"));

                    if(otherGroups.length != 0)
                        this.sectionTypeGroup = otherGroups[0];
                }).catch(() => this.failRender());

            return Promise.all([
                this.promises.unitTypesP,
                this.promises.mediatTypesP,
                this.promises.unitTypeGroupsP]);
        }

        async failRender() {
            await this.renderer.renderTemplate("rateCardDefault");

            $("#mainBody").empty();
            $("#mainBody").text(this.strings.noDefault);

            this.elements.rateCardDD = $("#rateCardDD");
            $("#save").addClass("hidden");

            const types = await this.promises.mediaTypesP;

            this.rateCardDD = new Dropdown(types, {
                container: this.elements.rateCardDD,
                promptText: this.strings.rateCardDDPrompt,
                textField: "value"
            });

            await this.rateCardDD.render();
            this.rateCardDD.selectByVal(this.mediaType.id);
            this.rateCardDD.change.subscribe(
                this.rateCardDDChangeHandler.bind(this));
        }

        async render() {
            await this.renderer.renderTemplate("rateCardDefault")
            this.renderPromises = [];

            this.elements.rateCardDD = $("#rateCardDD");
            this.elements.unitTypeDD = $("#unitTypeDD");
            this.elements.bodyAddButton = $("#bodyAddButton");
            this.elements.sectionAddButton = $("#sectionAddButton");
            this.elements.save = $("#save");
            this.elements.response = $("#response");
            this.elements.bodyUnitTypeTable = $("#bodyUnitTypeTable");
            this.elements.sectionUnitTypeTable = $("#sectionUnitTypeTable");

            this.elements.bodyAddButton.click(() =>
                this.tableAddUnitType(this.bodyUnitTypeTable));

            this.elements.save.click(() =>
                this.save());

            this.renderPromises.push(
            this.promises.mediaTypesP.then(async types => {
                this.rateCardDD = new Dropdown(types, {
                    container: this.elements.rateCardDD,
                    promptText: this.strings.rateCardDDPrompt,
                    textField: "value"
                });

                await this.rateCardDD.render();

                this.rateCardDD.selectByVal(this.mediaType.id);
                this.rateCardDD.change.subscribe(
                    this.rateCardDDChangeHandler.bind(this));
            }));

            this.renderPromises.push(
            this.promises.unitTypeGroupsP.then(() => {
                var tableRendsP = [];
                this.bodyUnitTypeTable = new Table(
                    this.elements.bodyUnitTypeTable,
                    util.cloneSimple(this.mediaTypeGroup.unitTypes),
                    columns);

                tableRendsP.push(
                this.bodyUnitTypeTable.render(this.tableRowDeleteClickHandler.bind(this)).then(() => {
                    $(".delete").remove();

                    this.sourceTypeGroup.unitTypes.forEach(ut =>
                        this.bodyUnitTypeTable.addItem(ut, this.tableRowDeleteClickHandler.bind(this)));
                }));

                if(this.sectionTypeGroup != null) {
                    this.sectionUnitTypeTable = new Table(
                        this.elements.sectionUnitTypeTable,
                        this.sectionTypeGroup.unitTypes,
                        columns);

                    tableRendsP.push(
                        this.sectionUnitTypeTable.render(this.tableRowDeleteClickHandler.bind(this)));

                    this.elements.sectionAddButton.click(() =>
                        this.tableAddUnitType(this.sectionUnitTypeTable));

                    $("#sectionTableContainer").removeClass("hidden");
                }
                return Promise.all(tableRendsP).then(
                    this.checkTableEmpty.bind(this));
            }));

            this.renderPromises.push(
            Promise.all([
                this.promises.unitTypesP,
                this.promises.unitTypeGroupsP])
            .then(([unitTypes]) => {
                unitTypes = unitTypes
                    .filter(ut => !this.unitTypesContains(this.mediaTypeGroup.unitTypes, ut))
                    .filter(ut => !this.unitTypesContains(this.sourceTypeGroup.unitTypes, ut))
                    .filter(ut => this.sectionTypeGroup == null ||
                        !this.unitTypesContains(this.sectionTypeGroup.unitTypes, ut));

                this.unitTypeDD = new Dropdown(unitTypes, {
                    container: this.elements.unitTypeDD,
                    promptText: this.strings.unitTypeDDPrompt,
                    textField: "longName"
                });

                this.elements.bodyAddButton.click(() =>
                    this.tableAddUnitType(this.bodyUnitTypeTable));

                return this.unitTypeDD.render();
            }));

            return Promise.all(this.renderPromises);
        }

        async save() {
            this.elements.response.empty();

            var savePromises = [];

            var saveTable = (targetGroup, sourceTable, filterFunc = util.pipe) => {
                targetGroup.unitTypes = sourceTable.model.filter(filterFunc);
                savePromises.push(MarketParticipantUnitTypeGroupRepo.save(targetGroup)
                    .then(resp => targetGroup = resp));
            };

            saveTable(this.sourceTypeGroup, this.bodyUnitTypeTable,
                ut => !this.unitTypesContains(this.mediaTypeGroup.unitTypes, ut));

            if(util.isDefined(this.sectionTypeGroup))
                saveTable(this.sectionTypeGroup, this.sectionUnitTypeTable);

            await Promise.all(savePromises);
            Noty.success(this.strings.saved);
        }

        tableAddUnitType(table) {
            if(!this.unitTypeDD.selected.val || this.unitTypeDD.selected.val < 1)
                return;

            const { item: ut, val } = this.unitTypeDD.selected;

            table.addItem(ut, this.tableRowDeleteClickHandler.bind(this));
            this.unitTypeDD.removeByVal(val);
            this.checkTableEmpty();
        }

        checkTableEmpty() {
            $("#bodyUnitTypeTable > .empty").remove();
            $("#sectionUnitTypeTable > .empty").remove();

            if(this.bodyUnitTypeTable.model.length == 0)
                this.elements.bodyUnitTypeTable.prepend(
                    $("<div>").addClass("empty").text(
                        this.strings.emptyTable));

            if(this.sectionUnitTypeTable.model.length == 0)
                this.elements.sectionUnitTypeTable.prepend(
                    $("<div>").addClass("empty").text(
                        this.strings.emptyTable));
        }

        tableRowDeleteClickHandler(row, ut) {
            var deleteButton = row.find(".delete");
            deleteButton.removeClass("hidden");

            deleteButton.click(() => {
                row.parent().remove();

                this.bodyUnitTypeTable.model = this.bodyUnitTypeTable.model
                    .filter(unitType => unitType.id != ut.id);

                this.sectionUnitTypeTable.model = this.sectionUnitTypeTable.model
                    .filter(unitType => unitType.id != ut.id);

                this.unitTypeDD.addItem(ut);
                this.checkTableEmpty();
            });
        }

        rateCardDDChangeHandler() {
            Router.navigate(`rateCardDefaultManager/${this.rateCardDD.selected.val}`, true);
        }

        unitTypesContains(unitTypes, unitType) {
            return unitTypes.some(mut => mut.id == unitType.id);
        }
    };
});
