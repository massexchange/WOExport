define(["jquery", "app/util", "app/router", "app/dropdown", "app/dal", "app/viewManager", "app/hub", "app/table",
    "app/rateCardSection", "app/repo/attrType", "app/permissionEvaluator", "app/repo/unitType",
    "app/repo/attrCache", "app/util/rateCard", "app/noty"],
function($, util, Router, Dropdown, dal, ViewManager, hub, Table, RCSection, AttrTypeRepo, permEval,
    UnitTypeRepo, AttrCacheRepo, rcUtil, Noty) {
    return class RateCard {
        constructor(rc) {
            this.model = rc;
            this.promises = {};
            this.elements = {};
            this.sectionsToDelete = [];
            this.canEdit = false;
            this.allSections = [];
            this.editLayoutMode = false;

            this.strings = {};
            this.strings.rcSaved = MX.strings.get("rateCard_saved");
            this.strings.deletedSections = MX.strings.get("rateCard_deletedSections");
            this.strings.secDropdownText = MX.strings.get("rateCard_sectionDropdown");
            this.strings.rcDropdownText = MX.strings.get("rateCard_dropdown");
            this.strings.error_missingUA = MX.strings.get("rateCard_error_missingUA");
            this.strings.error_missingPackage = MX.strings.get("rateCard_error_missingPackage");
            this.strings.hideLayout = MX.strings.get("rateCard_hideLayout");
            this.strings.editLayout = MX.strings.get("rateCard_editLayout");
            this.strings.save_enabled = MX.strings.get("save_enabled");
            this.strings.save_processing = MX.strings.get("save_processing");
        }

        init() {
            this.canEdit = permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD");

            if(!this.model.sections)
                this.model.sections = [];

            this.promises.allUnitTypesP = UnitTypeRepo.getAll();
            this.promises.adSizeTypeP = AttrTypeRepo.getByName("AdSize");

            this.promises.allSectionsP = dal.get("attr/deps", {
                parentId: this.model.keyAttribute.id
            }).then(sectionDeps =>
                this.allSections = sectionDeps.map(util.selectorFor("child")));

            this.promises.adSizes = AttrCacheRepo.getAttributes("AdSize");

            return this.promises.init = Promise.all([
                this.promises.allUnitTypesP,
                this.promises.adSizeTypeP,
                this.promises.allSectionsP,
                this.promises.adSizes]);
        }

        toggleEditMode() {
            if(this.editLayoutMode) {
                $(".rcedit").addClass("hidden");
                this.elements.editButton.val(this.strings.editLayout);
                if(this.canEdit)
                    $(".priceInput").prop("disabled", false);
            } else{
                $("input.rcedit").removeClass("hidden");
                if(this.unitTypeDD.model.length < 1)
                    this.elements.btnAddUnitType.addClass("hidden");

                if(this.adSizeDD.model.length < 1)
                    this.elements.btnAddAdSize.addClass("hidden");

                this.elements.editButton.val(this.strings.hideLayout);
                if(this.canEdit)
                    $(".priceInput").prop("disabled", true);
            }
            this.editLayoutMode = !this.editLayoutMode;
        }

        sectionToIdString(sec) {
            return `section${sec.section.id}`;
        }

        alphaSortSectionComparator(a, b) {
            return util.comparator.alpha(a.model.section.value, b.model.section.value);
        }

        addNewSection() {
            this.elements.btnNewSection.addClass("hidden");
            this.elements.sectionDD.removeClass("hidden");
        }

        toggleSaveButton() {
            if(this.elements.saveButton.prop("disabled")) {
                this.elements.saveButton.val(this.strings.save_enabled);
                this.elements.saveButton.prop("disabled", false);
            } else {
                this.elements.saveButton.val(this.strings.save_processing);
                this.elements.saveButton.prop("disabled", true);
            }
        }

        clearResponseDiv() {
            this.elements.responseDiv.text("");
            this.elements.responseDiv.empty();
        }

        hasUA(rows) {
            return rows.some(row => row.type.shortName == "UA");
        }

        getUA(rows) {
            return rows.filter(row => row.type.shortName == "UA")[0];
        }

        validate() {
            var errorMsgs = [];

            if(!this.hasUA(this.model.rows))
                errorMsgs.push(this.strings.error_missingUA);

            if(this.hasUA(this.model.rows) &&
                !this.getUA(this.model.rows)
                    .columns.some(col => col.adSize.value == "Package")
                )
                errorMsgs.push(this.strings.error_missingPackage);

            return errorMsgs;
        }

        async deleteCard() {
            await dal.delete(`rateCard/${this.model.id}`);
            Router.navigate("rateCardViewer", true);
        }

        async saveCard(packageAdSize) {
            //setup
            this.toggleSaveButton();
            Noty.closeAll();
            const failHandlerForArrays = resp => {
                this.toggleSaveButton();
                Noty.closeAll();
            };
            const needNavigate = !this.model.id;

            //validate
            const errorMsgs = this.validate();
            if(errorMsgs.length > 0) {
                this.toggleSaveButton();
                util.displayErrors(errorMsgs);

                return;
            }

            //delete sections
            var deleteSectionPs = [];
            if(!needNavigate)
                deleteSectionPs = this.sectionsToDelete.map(control =>
                    dal.delete(`rateCard/${control.cardId}/section/${control.id}`));

            const extraUrl = this.model.id ? ("/" + this.model.id) : "";
            const resp = await (!needNavigate
                ? dal.put
                : dal.post)(`rateCard${extraUrl}`, this.model);

            rcUtil.replaceNullWithPackageAdSizeInRows(resp.rows, packageAdSize);
            rcUtil.copyTableIntoTable(resp, this.model);
            this.model.id = resp.id;
            this.model.sections.forEach(sec =>
                sec.cardId = this.model.id);

            const sectionPs = this.model.sections.map(section => (section.id
                    ? dal.put
                    : dal.post)(`rateCard/${section.cardId}/section/${section.id || ""}`, section));

            const reportSuccess = () => {
                Noty.success(this.strings.rcSaved, 5000, false);
                this.toggleSaveButton();

                if(needNavigate)
                    Router.navigate(`rateCardViewer/${this.model.id}`, false);

                const readBack = new Event('readBack');
                $("input.priceInput").each((idx, el) =>
                    el.dispatchEvent(readBack));
            };

            const readBackSections = (sections) => {
                var sectionAttrtoSection = {};
                sectionAttrtoSection = sections.reduce((acc, val) => {
                    rcUtil.replaceNullWithPackageAdSizeInRows(val.rows, packageAdSize);
                    acc[val.section.id] = val;
                    return acc;
                }, {});

                this.model.sections.forEach(section => {
                    rcUtil.copyTableIntoTable(sectionAttrtoSection[section.section.id], section);
                    section.id = sectionAttrtoSection[section.section.id].id;
                });
            };

            const waitForDelete = async () => {
                try {
                    await Promise.all(deleteSectionPs);
                    this.sectionsToDelete = [];
                    reportSuccess();
                    Noty.success(this.strings.deletedSections, 5000, false);
                } catch(error) {
                    failHandlerForArrays(error);
                }
            };

            const readBackAndWaitForDelete = (...sections) => {
                sections = sections.filter(sec => util.isDefined(sec.id));
                if(sections.length > 0)
                    readBackSections(sections);

                if(deleteSectionPs.length > 0)
                    waitForDelete();
                else
                    reportSuccess();
            };

            try {
                await Promise.all(sectionPs);
                readBackAndWaitForDelete();
            } catch(err) {
                failHandlerForArrays(err);
            }
        }

        async generateBlankSection(sectionAttr) {
            const adSizes = rcUtil.collectAdSizesFromRows(this.model.rows);

            const types = await UnitTypeRepo.getByType(sectionAttr.type);

            const rows = types.unitTypes.map(unitType => {
                //create a column per adsize
                const columns = adSizes.map(size => ({
                    adSize: size,
                    price: 0.01
                }));

                return {
                    type: unitType,
                    columns: columns
                };
            });

            return {
                rows: rows,
                section: sectionAttr
            };
        }

        generateDeleteSectionCallBack(section) {
            return () => {
                this.model.sections = this.model.sections
                    .filter(sec => sec.section != section.section);

                if(section.id)
                    this.sectionsToDelete.push(section);

                this.generateSectionDD();
            };
        }

        generateSectionDD() {
            var usedSectionsMap = {};
            this.model.sections.forEach(sec => {
                usedSectionsMap[sec.section.value] = true;
            });

            var usableSections = this.allSections.filter(sec => !usedSectionsMap[sec.value]);
            this.sectionDD = new Dropdown(usableSections, {
                container: this.elements.sectionDD,
                promptText: this.strings.secDropdownText,
                textField: "value"
            });
            this.sectionDD.render();

            this.sectionDD.change.subscribe(async ({ item: selectedSection }) => {
                const sectionData = await this.generateBlankSection(selectedSection);

                this.model.sections.push(sectionData);
                this.model.sections.sort(
                    util.mapCompare(sec =>
                        sec.section.value,
                        util.comparator.alpha));

                this.renderSection(sectionData);
                this.elements.sectionDD.addClass("hidden");

                this.generateSectionDD();
            });

            if(usableSections.length > 0)
                this.elements.btnNewSection.removeClass("hidden");
            else
                this.elements.btnNewSection.addClass("hidden");
        }

        async generateRateCardDropdown() {
            const rateCards = await dal.get("rateCard", { mpId: MX.session.creds.user.mp.id });

            this.rateCardDD = new Dropdown(rateCards, {
                container: this.elements.rateCardDD,
                promptText: this.strings.rcDropdownText,
                textField: "keyAttribute.value"
            });

            await this.rateCardDD.render();
            $(`#rcDropdown option[value= ${this.model.id}]`).prop("selected", true);

            this.rateCardDD.change.subscribe(({ val }) =>
                Router.navigate(`rateCardViewer/${val}`, true));
        }

        generateUnitTypeDD(usableUTs) {
            return new Dropdown(usableUTs, {
                container: this.elements.unitTypeDD,
                textField: "longName"
            });
        }

        generateAdSizeDD(usableASs) {
            return new Dropdown(usableASs, {
                container: this.elements.adSizeDD,
                textField: "value"
            });
        }

        generateTable(container, model, columns) {
            return new Table(container, model, columns);
        }

        async renderSection(section) {
            var container = $("<div>").prop("id", this.sectionToIdString(section));

            var newPosition = this.model.sections.findIndex(sec => sec == section);
            if(newPosition == - 1)
                return;

            if(newPosition == 0)
                container.prependTo(this.elements.sectionTable);
            else
                container.insertAfter(
                    $(`#${this.sectionToIdString(this.model.sections[newPosition - 1])}`));

            const control = new RCSection(container, section, this.generateDeleteSectionCallBack(section));

            await control.init();
            return control.render();
        }

        renderSections() {
            this.model.sections.sort(util.mapCompare(
                sec => sec.section.value,
                util.comparator.alpha));

            this.model.sections.map(
                this.renderSection.bind(this));
        }

        setRenderer(rend) {
            this.renderer = rend;
        }

        async render() {
            await this.renderer.renderTemplate("rateCard", this.model);

            this.elements.table = $("#primaryCardTableDiv");
            this.elements.sectionDD = $("#sectionDropdownDiv");
            this.elements.btnNewSection = $("#btnNewSection");
            this.elements.rateCardDD = $("#rcDropdown");
            this.elements.rateCardTable = $("#primaryCardTableDiv");
            this.elements.saveButton = $("#save");
            this.elements.deleteButton = $("#deleteButton");
            this.elements.sectionTable = $("#sectionCardTableDiv");
            this.elements.responseDiv = $("#responseMsg");
            this.elements.btnAddUnitType = $("#btnAddUnitType");
            this.elements.unitTypeDD = $("#unitTypeDD");
            this.elements.btnAddAdSize = $("#btnAddAdSize");
            this.elements.adSizeDD = $("#adSizeDD");
            this.elements.editButton = $("#editButton");

            if(this.canEdit) {
                this.promises.allSectionsP.then(() => {
                    this.generateSectionDD();
                    this.elements.btnNewSection.click(() => this.addNewSection());
                });

                this.elements.editButton.removeClass("hidden");
                this.elements.editButton.click(() => this.toggleEditMode());
            }

            if(this.model.id != null)
                this.generateRateCardDropdown();
            else
                this.elements.rateCardDD.text(this.model.keyAttribute.value);

            const [adSizeType, adSizes, unitTypes] = await Promise.all([
                this.promises.adSizeTypeP,
                this.promises.adSizes,
                this.promises.allUnitTypesP]);

            const packageAdSize = {
                value: "Package",
                type: adSizeType
            };
            adSizes.push(packageAdSize);
            rcUtil.replaceNullWithPackageAdSizeInRows(this.model.rows, packageAdSize);
            rcUtil.renderTable(this, unitTypes, adSizes);

            if(this.canEdit) {
                rcUtil.setUpButtonAddAdSize(this, unitTypes, adSizes);
                rcUtil.setUpButtonAddUnitType(this, unitTypes, adSizes);

                this.elements.saveButton.removeClass("hidden");
                this.elements.saveButton.click(() =>
                    this.saveCard(packageAdSize));

                if(this.model.id) {
                    $("#deleteButton").removeClass("hidden");
                    $("#deleteButton").click(this.deleteCard.bind(this));
                }
            }

            this.renderSections();
        }
    };
});
