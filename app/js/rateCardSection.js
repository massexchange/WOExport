define(["app/util", "app/dal", "app/renderer", "app/table", "app/unitType", "app/permissionEvaluator",
    "app/repo/unitType", "app/repo/attrType", "app/dropdown", "app/repo/attrCache",
    "app/util/rateCard"],
function(util, dal, Renderer, Table, UnitType, permEval, UnitTypeRepo, AttrTypeRepo, Dropdown,
    AttrCacheRepo, rcUtil) {
    return class RateCardSection {
        constructor(container, section, onDeleteCallBack = util.noop) {
            this.model = section;
            this.container = container;
            this.renderer = new Renderer(this.container);
            this.promises = {};
            this.elements = {};
            this.onDeleteCallBack = onDeleteCallBack;
            this.editLayoutMode = false;
        }
        init() {
            this.canEdit = permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD");

            this.promises.allUnitTypesP = UnitTypeRepo.getAll();
            this.promises.adSizeTypeP = AttrTypeRepo.getByName("AdSize");
            this.promises.adSizes = AttrCacheRepo.getAttributes("AdSize");

            return Promise.all([
                this.promises.allUnitTypesP,
                this.promises.adSizeTypeP,
                this.promises.adSizes]);
        }
        toggleEditMode() {
            if(!this.editLayoutMode) {
                if(this.unitTypeDD.model.length < 1)
                    this.elements.btnAddUnitType.addClass("hidden");
                if(this.adSizeDD.model.length < 1)
                    this.elements.btnAddAdSize.addClass("hidden");
            }
            this.editLayoutMode = !this.editLayoutMode;
        }
        generateUnitTypeDD(usableUTs) {
            return new Dropdown(usableUTs, {
                container: this.elements.unitTypeDD,
                textField: "longName"
            });
        }
        generateAdSizeDD(usableASs) {
            return  new Dropdown(usableASs, {
                container: this.elements.adSizeDD,
                textField: "value"
            });
        }
        generateTable(container, model, columns) {
            return new Table(container, model, columns);
        }
        async render() {
            await this.renderer.renderTemplate("rateCardSection", { data: this.model });

            this.elements.deleteButton = this.container.find(`#${this.model.section.id}`);
            this.elements.table = this.container.find("#sectionTable");
            this.elements.btnAddUnitType = this.container.find("#btnAddUnitType");
            this.elements.unitTypeDD = this.container.find("#unitTypeDD");
            this.elements.btnAddAdSize = this.container.find("#btnAddAdSize");
            this.elements.adSizeDD = this.container.find("#adSizeDD");

            if(this.canEdit) {
                this.elements.deleteButton.removeClass("hidden");
                this.elements.deleteButton.click(() => {
                    this.container.remove();
                    this.onDeleteCallBack();
                });

                $("#editButton").click(() => this.toggleEditMode());
            }

            const [adSizeType, adSizes, unitTypes] = await Promise.all([
                this.promises.adSizeTypeP,
                this.promises.adSizes,
                this.promises.allUnitTypesP]);

            var packageAdSize = {
                value: "Package",
                type: adSizeType
            };
            adSizes.push(packageAdSize);
            rcUtil.replaceNullWithPackageAdSizeInRows(this.model.rows, packageAdSize);
            rcUtil.renderTable(this, unitTypes, adSizes);

            if(this.canEdit) {
                rcUtil.setUpButtonAddAdSize(this, unitTypes, adSizes);
                rcUtil.setUpButtonAddUnitType(this, unitTypes, adSizes);
            }
        }
    };
});
