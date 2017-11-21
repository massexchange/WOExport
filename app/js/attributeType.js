define(["jquery", "app/dal", "app/util", "app/dropdown", "app/repo/attrType", "app/repo/attrTypeDependency",
"app/repo/attrTypeLabel", "app/mutableRowTable", "app/router", "app/noty", "app/util/render", "app/resourceManager"],
function($, dal, util, Dropdown, AttrTypeRepo, AttrTypeDependencyRepo, AttrTypeLabelRepo,
MutableRowTable, Router, Noty, renderUtil, ResourceManager) {
    const diffMaps = (depMap, otherDepMap) =>
        Object.entries(depMap).reduce((output, [key, originalVersion]) => {
            const newVersion = otherDepMap[key];
            if(!newVersion)
                output.push(originalVersion);
            else
                newVersion.id = originalVersion.id;

            return output;
        }, []);

    return class AttributeType extends ResourceManager() {
        constructor(attrType) {
            super();

            this.model = attrType;
            this.elements = {};

            this.message = MX.strings.store["attrType"];

            this.originalParentDeps = []; //deps that I am child of
            this.originalChildDeps = []; //deps that I am parent of

            this.addResources(() => ({
                typesP: AttrTypeRepo.getAll(),
                depsP: AttrTypeDependencyRepo.getAll(),
                labelsP: AttrTypeLabelRepo.getAll(),
                componentsP: dal.get("component")
            }));
        }
        setRenderer(rend) {
            this.renderer = rend;
        }
        init() {
            return this.fetchResources();
        }
        async onSave() {
            this.elements.response.empty();

            //attributeType
            this.model.name = this.elements.nameField.val();

            //don'te allow a name of all whitespace
            if(this.model.name.trim().length == 0) {
                Noty.error(this.message.error.emptyName);
                return;
            }

            const { item: component } = await this.componentsDD.getModel();
            this.model.component = component;
            this.model.labels = this.labelTable.getData();

            const resp = await AttrTypeRepo.save(this.model);
            this.model = resp;

            const getChildName = ({ child: { name } }) => name;
            const getParentName = ({ parent: { name } }) => name;

            const originalChildDepsMap = util.indexList(this.originalChildDeps,
                getChildName);

            const originalParentDepsMap = util.indexList(this.originalParentDeps,
                getParentName);

            const newChildDepsMap = util.indexList(
                this.childDepsTable.getData().map(dep => {
                    dep.parent = this.model;
                    return dep;
                }),
                getChildName);

            const newParentDepsMap = util.indexList(
                this.parentDepsTable.getData().map(dep => {
                    dep.child = this.model;
                    return dep;
                }),
                getParentName);

            const depsToDelete = [
                ...diffMaps(originalChildDepsMap, newChildDepsMap),
                ...diffMaps(originalParentDepsMap, newParentDepsMap)];

            const depsToSave = [
                ...diffMaps(newChildDepsMap, originalChildDepsMap),
                ...diffMaps(newParentDepsMap, originalParentDepsMap)];

            const savePs = depsToSave.map(async dep => {
                try {
                    return await AttrTypeDependencyRepo.save(dep);
                } catch(error) {
                    Noty.error(
                        util.errorMsg(
                            this.message.error.saveDeps(dep),
                            error));
                }
            });
            const deletePs = depsToDelete.map(async dep => {
                try {
                    return await AttrTypeDependencyRepo.delete(dep);
                } catch(error) {
                    Noty.error(
                        util.errorMsg(
                            this.message.error.delDeps(dep),
                            error));
                }
            });

            try {
                await Promise.all([...savePs, ...deletePs]);
            } catch(error) {
                Noty.error(
                    util.errorMsg(
                        this.message.error.saiving,
                        error));
            }

            Noty.closeAll();
            Router.navigate(`attributeTypeManagement/${resp.id}`, true);

            const control = new AttributeType(resp);
            control.setRenderer(this.renderer);

            await control.init();
            return control.render();
        }
        generateDeleteHandler(table, dropDown, selector) {
            //if ParentOChild is true we are adding the parent into the dropdown, child if false
            return (container, element) => {
                container.find(".delete").click(() => {
                    table.removeByFunc(el =>
                        el.model.parent.id == element.parent.id &&
                        el.model.child.id == element.child.id);

                    dropDown.addItem(selector(element));
                });
            };
        }
        generateRenderHandler(deps, table, dropDown, button, ParentChildOrder) {
            //if ParentChildOrder is true, the first filter is on parents the second is on children
            //if ParentChildOrder is true, we are looking for deps that the model is a parent of
            return () => {
                const existingDeps = deps.filter(dep =>
                    (ParentChildOrder
                        ? dep.parent.id
                        : dep.child.id
                    ) == this.model.id);

                table.addAll(existingDeps);

                existingDeps.forEach(dep =>
                    dropDown.removeByVal(!ParentChildOrder
                        ? dep.parent.id
                        : dep.child.id));

                if(!ParentChildOrder)
                    this.originalParentDeps = existingDeps;
                else
                    this.originalChildDeps = existingDeps;

                dropDown.change.subscribe(() =>
                    button.prop("disabled", false));
            };
        }
        generateClickHandler(parentGetter, childGetter, table, dropDown, button) {
            return async () => {
                const [parent, child] = await Promise.all([parentGetter(), childGetter()]);
                table.add({ parent, child });

                const selected = await dropDown.getModel();

                dropDown.removeByVal(selected.val);

                button.prop("disabled", true);
            };
        }
        async render() {
            await this.renderer.renderTemplate("attributeType");

            this.elements = renderUtil.selectElements({
                nameField: "#nameField",
                componentsDD: "#componentsDD",
                typeDD: "#typeDD",
                parentDepsDD: "#parentDependencyDD",
                parentDepsAdd: "#parentDependencyAdd",
                parentDepsTable: "#parentDependencyTable",
                childDepsDD: "#childDependencyDD",
                childDepsAdd: "#childDependencyAdd",
                childDepsTable: "#childDependencyTable",
                labelDD: "#labelDD",
                labelAdd: "#labelAdd",
                labelTable: "#labelTable",
                save: "#saveButton",
                response: "#response"
            });

            const { nameField, save, labelAdd, typeDD, componentsDD, labelDD, labelTable } = this.elements;

            nameField.val(this.model.name);

            save.click(this.onSave.bind(this));

            labelAdd.click(async () => {
                const { item, val } = await this.labelDD.getModel();

                this.labelTable.add(item);
                this.labelDD.removeByVal(val);
                this.labelDD.reset();

                labelAdd.prop("disabled", true);
            });

            const { depsP, typesP, componentsP, labelsP } = this.resources;

            const types = await typesP;
            this.typeDD = new Dropdown(types, {
                container: typeDD,
                promptText: this.message.dropdownTypesText,
                textField: "name"
            });
            await this.typeDD.render();

            if(this.model.id != null)
                this.typeDD.selectByVal(this.model.id);

            this.typeDD.change.subscribe(async ({ item, val }) => {
                Router.navigate(`attributeTypeManagement/${val}`, true);

                const control = new AttributeType(item);
                control.setRenderer(this.renderer);

                await control.init();
                control.render();
            });

            componentsP.then(async components => {
                this.componentsDD = new Dropdown(components, {
                    container: componentsDD,
                    promptText: this.message.dropdownCategoriesText,
                    textField: "name"
                });
                await this.componentsDD.render();
                this.componentsDD.selectByVal(this.model.component.id);
            });

            Promise.all([depsP, typesP]).then(
                this.initControls.bind(this));

            const labels = await labelsP;
            this.labelDD = new Dropdown(labels, {
                container: labelDD,
                promptText: this.message.dropdownLabelsText,
                textField: "value"
            });

            this.labelDD.render().then(() => {
                if(this.model.labels != null)
                    this.model.labels.forEach(({ id }) =>
                        this.labelDD.removeByVal(id));

                this.labelDD.change.subscribe(() =>
                    labelAdd.prop("disabled", false));
            });

            this.labelTable = new MutableRowTable(labelTable);
            this.labelTable.setTemplate("attrTypeLabelRow");
            this.labelTable.setContainerProcessor((container, element) =>
                container.find(".delete").click(() => {
                    this.labelTable.removeByFunc(el =>
                        el.model.id == element.id);

                    this.labelDD.addItem(element);
                })
            );
            this.labelTable.addAll(this.model.labels);
        }
        initControls([deps, types]) {
            const { parentDepsTable, childDepsTable, parentDepsDD, childDepsDD,
                parentDepsAdd, childDepsAdd } = this.elements;

            this.parentDepsTable = new MutableRowTable(parentDepsTable);
            this.parentDepsTable.setTemplate("attrTypeParentRow");

            this.childDepsTable = new MutableRowTable(childDepsTable);
            this.childDepsTable.setTemplate("attrTypeChildRow");

            this.parentDepsDD = new Dropdown(
                types.filter(({ id }) =>
                    id != this.model.id),
                {
                    container: parentDepsDD,
                    promptText: this.message.dropdownParentsText,
                    textField: "name"
                });

            this.childDepsDD = new Dropdown(
                types.filter(({ id }) =>
                    id != this.model.id),
                {
                    container: childDepsDD,
                    promptText: this.message.dropdownChildrenText,
                    textField: "name"
                });

            this.parentDepsTable.setContainerProcessor(
                this.generateDeleteHandler(
                    this.parentDepsTable,
                    this.parentDepsDD,
                    ({ parent }) => parent));

            this.childDepsTable.setContainerProcessor(
                this.generateDeleteHandler(
                    this.childDepsTable,
                    this.childDepsDD,
                    ({ child }) => child));

            this.parentDepsDD.render().then(
                this.generateRenderHandler(
                    deps,
                    this.parentDepsTable,
                    this.parentDepsDD,
                    parentDepsAdd,
                    false));

            this.childDepsDD.render().then(
                this.generateRenderHandler(
                    deps,
                    this.childDepsTable,
                    this.childDepsDD,
                    childDepsAdd,
                    true));

            parentDepsAdd.click(
                this.generateClickHandler(
                    async () => {
                        const { item } = await this.parentDepsDD.getModel();
                        return item;
                    },
                    () => this.model,
                    this.parentDepsTable,
                    this.parentDepsDD,
                    parentDepsAdd));

            childDepsAdd.click(
                this.generateClickHandler(
                    () => this.model,
                    async () => {
                        const { item } = await this.childDepsDD.getModel();
                        return item;
                    },
                    this.childDepsTable,
                    this.childDepsDD,
                    childDepsAdd));
        }
    };
});
