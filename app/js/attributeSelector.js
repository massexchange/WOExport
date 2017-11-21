define(["app/renderer", "app/util", "app/dal", "app/repo/attr", "app/repo/attrType", "app/dropdown"],
function(Renderer, util, dal, AttrRepo, AttrTypeRepo, Dropdown) {
    return function(selected, container, attributes, options = {}) {
        var exports = {};

        //Extract options
        var noEdit = false;
        var requiredTypes = [];
        exports.onChange = options.onChange || util.noop;

        var ownerTypes = [];
        var coreTypes = [];
        var extraHidden;
        var canHide;
        var lastThresh; //true means we are over 10, false means we are under 10, t->f, f->t is whats important
        var toggleButton;

        const message = MX.strings.store["attrSel"];

        exports.indexFuncs = {};
        exports.indexFuncs.orderAlpha = (item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap) => {
            var allChildrenAndMe = (start) => {
                if(!start.children || start.children.length == 0)
                    return [start];
                return util.flatten(start.children
                    .map((child) => allChildrenAndMe(child))
                    .unshift([start])
                    );
            };
            var flatList = util.flatten(
                renderedAttrTypesForest.map((root) => allChildrenAndMe(root))
                );
            flatList.sort(util.mapCompare(x => x.attrTypeName, util.comparator.alpha));

            //render it alphabetically
            var lastEl = -1;
            flatList.forEach((el) => {
                if(util.comparator.alpha(el.attrTypeName, item.attrTypeName) < 1)
                    lastEl = flatList.indexOf(el);
            });
            if(lastEl != -1)
                item.rowContainer.insertAfter(flatList[lastEl].rowContainer);
            else
                masterContainer.prepend(item.rowContainer);

            //insert into tree
            //it knows if it has a parent or not
            if(item.parent) {
                item.parent.children.push(item);
                renderedAttrTypesMap[item.attrTypeName] = item;
                return;
            }
            //didn't find a parent slap it at the end then;
            renderedAttrTypesForest.push(item);
            renderedAttrTypesMap[item.attrTypeName] = item;
            return;
        };
        const findLastLeaf = start => {
            if(!start.children || start.children.length == 0)
                return start;

            return findLastLeaf(start.children[start.children.length - 1]);
        };
        const spliceIn = (array, after, item) => {
            array.splice(
                array.indexOf(after) + 1,
                0,
                item
            );
        };
        exports.indexFuncs.dependency = (item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap) => {
            //it knows if it has a parent or not
            if(item.parent) {
                var beforeEl = findLastLeaf(item.parent);
                item.rowContainer.insertAfter(beforeEl.rowContainer);
                item.parent.children.push(item);
                renderedAttrTypesMap[item.attrTypeName] = item;
                return;
            }
            //didn't find a parent slap it at the end then
            masterContainer.append(item.rowContainer);
            renderedAttrTypesForest = renderedAttrTypesForest.push(item);
            renderedAttrTypesMap[item.attrTypeName] = item;
            return;
        };
        exports.indexFuncs.initial = (item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap) => {
            //2 absolutes
            if(item.attrTypeName == "MediaType") {
                masterContainer.prepend(item.rowContainer);
                renderedAttrTypesForest.unshift(item);
                renderedAttrTypesMap["MediaType"] = item;
                return;
            }
            if(item.attrTypeName == "Device") {
                masterContainer.prepend(item.rowContainer);
                renderedAttrTypesForest.unshift(item);
                renderedAttrTypesMap["Device"] = item;
                return;
            }

            //DMA after Device
            if(item.attrTypeName == "DMA") {
                if(renderedAttrTypesMap["Device"]) {
                    var beforeEl = findLastLeaf(renderedAttrTypesMap["Device"]);
                    item.rowContainer.insertAfter(beforeEl.rowContainer);
                    spliceIn(renderedAttrTypesForest, beforeEl, item);
                    renderedAttrTypesMap["DMA"] = item;
                    return;
                }
                exports.indexFuncs.dependency(item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap);
                return;
            }
            //must be first child
            if(ownerTypes.some((oT) => oT.name == item.attrTypeName)) {
                if(renderedAttrTypesMap["MediaType"]) {
                    item.rowContainer.insertAfter(renderedAttrTypesMap["MediaType"].rowContainer);
                    renderedAttrTypesMap["MediaType"].children.unshift(item);
                    renderedAttrTypesMap[item.attrTypeName] = item;
                    return;
                }
                exports.indexFuncs.dependency(item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap);
                return;
            }
            //adSize must be first or second
            if(item.attrTypeName == "AdSize") {
                //if OwnerType go after its chain, it should be first
                var renderedOwners = ownerTypes.filter((oT) => renderedAttrTypesMap[oT.name]);
                if(renderedOwners.length != 0) {
                    var beforeEl = findLastLeaf(renderedAttrTypesMap[renderedOwners[0].name]);
                    item.rowContainer.insertAfter(beforeEl.rowContainer);
                    if(renderedAttrTypesMap["MediaType"]) {
                        spliceIn(renderedAttrTypesMap["MediaType"].children, renderedAttrTypesMap[renderedOwners[0].name], item);
                    }
                    else{
                        spliceIn(renderedAttrTypesForest, renderedAttrTypesMap[renderedOwners[0].name], item);
                    }
                    renderedAttrTypesMap["AdSize"] = item;
                    return;
                }
                //else it mus be first child of MediaType
                if(renderedAttrTypesMap["MediaType"]) {
                    item.rowContainer.insertAfter(renderedAttrTypesMap["MediaType"].rowContainer);
                    renderedAttrTypesMap["MediaType"].children.unshift(item);
                    renderedAttrTypesMap["AdSize"] = item;
                    return;
                }
                //welp both MediaType and an OwnerType don't exist
                exports.indexFuncs.dependency(item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap);
                return;
            }
            //else it is by parent
            exports.indexFuncs.dependency(item, masterContainer, typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap);
            return;
        };

        exports.indexFunc = options.orderAlpha ? exports.indexFuncs.orderAlpha : exports.indexFuncs.initial;

        if(options)
        {
            noEdit = options.noEdit != null ? options.noEdit : false;
            requiredTypes = options.requiredTypes != null ? options.requiredTypes : [];
        }

        exports.model = attributes;

        var attrSelectorContainer;

        var groupedAttrs = {};

        /*
            Stores an array of
            {
                "attrTypeName": name,
                "attrId": id,
                "element": array of html elements of the label and dropdown
                "children": array of attrIds that depend on this attr
             }
        */
        var selectedAttributes = [];

        /*
            Stores an array of
            {
                "attrTypeName": the type name
                "labelContainer": the container of the label
                "dropdownContainer": the container of the dropdown
                "rowContainer": the container of the whole row
                "parent": the parent type
                "children": an array of children
                "dropdown": its dropdown
            }
        */
        const renderedAttrTypesForest = [];
        const renderedAttrTypesMap = {};
        var renderedAttrTypeNoneCore = []; //last used insert into back, oldest shifts out front

        var rootTypes;
        var selectedType;

        const renderer = new Renderer(container);

        const currentCount = function() {
            return util.values(renderedAttrTypesMap)
                .filter(n =>
                    n != null
                ).length;
        };

        const isCore = function(typeData) {
            return coreTypes.some(cT =>
                cT.name == typeData.attrTypeName);
        };

        const propHideType = function(typeData, bool) {
            const func = bool
                ? "hide"
                : "show";

            typeData.rowContainer[func]();
            typeData.labelContainer[func]();
            typeData.dropdownContainer[func]();
        };

        const findAndHide = function() {
            var toHideCount = currentCount() - 10;
            renderedAttrTypeNoneCore.forEach((typeName) => {
                if(toHideCount > 0) {
                    propHideType(renderedAttrTypesMap[typeName], true);
                    toHideCount--;
                }
            })
        };

        const hasSelected = function(dropdown) {
            return dropdown.selected.val != 0 && dropdown.selected.val != "default";
        };

        const propHideAll = function(bool) {
            util.values(renderedAttrTypesMap)
                .filter(n => n != null)
                .filter(type =>
                    !isCore(type) &&
                    (!hasSelected(type.dropdown) || !bool))
                .forEach(type =>
                    propHideType(type, bool));
        };

        const toggleHidding = function(button) {
            extraHidden = !extraHidden;

            button.prop("value", extraHidden
                ? message.seeMore
                : message.hideExtra);

            if(extraHidden && canHide)
                findAndHide();
            else
                propHideAll(false);
        };

        const checkCount = function() {
            //did we go over 10?
            canHide = currentCount() > 10;
            toggleButton.prop("hidden", !canHide);

            //threshold stuff
            if(canHide && !lastThresh)
                //was under 10 now we go over
                lastThresh = true;

            if(!canHide && lastThresh) {
                //was over 10 now we go under
                lastThresh = false;
                propHideAll(false);
            }

            if(canHide && extraHidden) {
                findAndHide();
                propHideAll(false);
            }
        };

        var buildTypeForest = function(attrTypeDeps) {
            // Represent the forest as multimap aka dict of typename : [list of child typenames]
            // We might end up with eg MediaType as a root parent (ie always required in the
            // selection), and AdSize, Publisher, etc as children of that.
            var forestMaps = {};
            forestMaps.parentChild = {};
            forestMaps.childParent = {};

            attrTypeDeps.forEach(dep => {
                if(util.isDefined(forestMaps.parentChild[dep.parent.name]))
                    forestMaps.parentChild[dep.parent.name].push(dep.child.name);
                else
                    // Otherwise start a new list of its children.
                    forestMaps.parentChild[dep.parent.name] = [dep.child.name];

                if(util.isDefined(forestMaps.childParent[dep.child.name]))
                    forestMaps.childParent[dep.child.name].push(dep.parent.name);
                else
                    // Otherwise start a new list of its children.
                    forestMaps.childParent[dep.child.name] = [dep.parent.name];
            });

            return forestMaps;
        };

        // Map from attr id to Attribute objects
        var attrsById = {};
        // Forest (in map form) representing dependencies between AttributeTypes.
        var typeForestMaps;
        // Map representing dependencies between Attributes. Map from child to parent.
        var attrParentMap = {};

        //Converts the tree child object into an array and sorts it
        var processChildren = (obj = []) =>
            Object.keys(obj)
                .map(key => obj[key])
                .sort((a,b) => a.id - b.id);

        var isSelected = function(attrIdList) {
            return selectedAttributes.some(function(obj) {
                var eq = function(a, b) { return a == b; };
                return util.contains(attrIdList, eq, obj.attrId);
            });
        };

        var removeSelectedTarget = function(parentAttrType) {
            selectedAttributes = selectedAttributes.filter((obj) => obj.attrTypeName != parentAttrType);
            var targetItem = renderedAttrTypesMap[parentAttrType];
            if(targetItem) {
                targetItem.children.forEach((child) => removeRenderedDropdownsAndChildren(child.attrTypeName));
                targetItem.children = [];
            }
        };
        //Removes dropdowns and any children dropdowns it may have
        var removeRenderedDropdownsAndChildren = function(parentAttrType) {
            if(renderedAttrTypesMap[parentAttrType].children.length != 0)
                renderedAttrTypesMap[parentAttrType].children.forEach((child) => removeRenderedDropdownsAndChildren(child.attrTypeName));

            selectedAttributes = selectedAttributes.filter((obj) => { return obj.attrTypeName != parentAttrType; });
            renderedAttrTypesMap[parentAttrType].rowContainer.remove();
            renderedAttrTypesMap[parentAttrType] = null;
            renderedAttrTypeNoneCore = renderedAttrTypeNoneCore.filter((type) => type != parentAttrType);
        };

        var renderDropdowns = function(typeName, filterDeps) {
            var dd = initDropdown(typeName, filterDeps);
            if(dd)
                return dd.render();
        };

        var initDropdown = function(typeName, filterDeps) {
            if(renderedAttrTypesMap[typeName])
                return;
            var childAttrs = processChildren(groupedAttrs[typeName]);

            if(filterDeps)
                childAttrs = childAttrs.filter(attr =>
                    isSelected(attrParentMap[attr.id]));

            //If this attrType has attrs, render a dropdown of them
            if(childAttrs.length == 0)
                return;
                //throw new Error(`AttributeType ${typeName} has no attributes!`);

            //Adds spaces to convert from camelCase to Regular Form.
            var regularFormTypeName = typeName.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) { return str.toUpperCase(); });
            var labelContainer = $("<label>").append(regularFormTypeName+": ");
            var dropdownContainer = $("<p>");
            var rowContainer = $("<div>").addClass("attrSelectorRow").append(labelContainer).append(dropdownContainer);

            var required = requiredTypes.filter(function(str) { return str == typeName; }).length > 0;
            var requiredText = required ? message.dropdownRequired : message.dropdownDefault;

            var dropdown = new Dropdown(childAttrs, {
                container: dropdownContainer,
                promptText: requiredText,
                textField: "value",
                enableDefault: !required,
                disableDropdown: noEdit
            });

            dropdown.change.subscribe(({ item, val }) => {
                //if the new option is not the default
                if(val != 0 && val != "default") {
                    //Remove existing selected attr of this type, if it exists
                    removeSelectedTarget(typeName);
                    //not allowed to hide
                    renderedAttrTypeNoneCore = renderedAttrTypeNoneCore.filter((type) => type != typeName);

                    //Add new selected attr of this type
                    var attrData = {
                        attrTypeName: item.type.name,
                        attrId: val,
                        children: []
                    };
                    selectedAttributes.push(attrData);

                    //If selected attr's type has child types, render those now
                    var selectedAttrChildTypes = typeForestMaps.parentChild[item.type.name];
                    if(selectedAttrChildTypes)
                        selectedAttrChildTypes.forEach(childTypeName =>
                            renderDropdowns(childTypeName, true));
                } else { //otherwise the dropdown was set ack to 'any'
                    //Remove existing selected attr of this type, if it exists
                    removeSelectedTarget(typeName);
                    checkCount();
                    renderedAttrTypeNoneCore.push(typeName);
                }
                //onChange
                exports.onChange();
            });

            var parentName = typeForestMaps.childParent[typeName] ? typeForestMaps.childParent[typeName][0] : null;
            var parentData = parentName ? (renderedAttrTypesMap[parentName] ? renderedAttrTypesMap[parentName] : null) : null;

            var typeData = {
                "attrTypeName": typeName,
                "labelContainer": labelContainer,
                "dropdownContainer": dropdownContainer,
                "rowContainer": rowContainer,
                "parent": parentData,
                "children": [],
                "dropdown": dropdown
            };

            exports.indexFunc(typeData, attrSelectorContainer.find(".table"), typeForestMaps, renderedAttrTypesForest, renderedAttrTypesMap);

            checkCount();
            if(!isCore(typeData))
                renderedAttrTypeNoneCore.push(typeName);

            return dropdown;
        };

        var render = exports.render = async function() {
            const renderResult = await renderer.renderView("attributeSelector");
            await initPromise;

            attrSelectorContainer = renderResult;

            toggleButton = attrSelectorContainer.find("#hideToggle");
            toggleButton.click(() =>
                toggleHidding(toggleButton));

            //Temporarily add nonroot preselected attrs to attrselector's data struct that keeps track of this
            //So initDropdown knows to filter child attrs
            selectedAttributes.push(...selected.map(attr => ({
                attrTypeName: attr.type.name,
                attrId: attr.id,
                children: []
            })));

            //Get types of preselected attributes
            const selectedTypes = selected.map(function(attr) { return attr.type.name; });

            //Add them to the root types that are always rendered
            const typesToRender = rootTypes.concat(
                selectedTypes.filter(type =>
                    !rootTypes.some(rt =>
                        rt == type)))
                //filter out types without attrs
                .filter(typeName =>
                    groupedAttrs[typeName]);

            //Keep track of the dropdowns with preselections
            const dropdowns = util.mapTo(typesToRender, typeName =>
                initDropdown(typeName, !rootTypes.includes(typeName)));

            //filter out bad dropdowns
            //TODO: FIX THIS SHIT
            Object.entries(dropdowns)
                .filter(([typeName, dropdown]) =>
                    !util.isDefined(dropdown))
                .forEach(([typeName]) =>
                    delete dropdowns[typeName]);

            //Render them
            const dropdownPs = [];
            for(var typeName in dropdowns)
                if(dropdowns.hasOwnProperty(typeName) && dropdowns[typeName] != null)
                    dropdownPs.push(dropdowns[typeName].render());

            //Select the ones that were preselected and add them to model
            await Promise.all(dropdownPs);

            selectedAttributes = [];
            selected.forEach(attr => {
                //TODO: replace with the appropriate dd.selectByVal
                $(`option[value=${attr.id}]`)
                    .prop("selected", true);

                if(dropdowns.length > 0)
                    removeRenderedDropdownsAndChildren(util.last(Object.keys(dropdowns)));

                //Remove existing selected attr of this type, if it exists
                selectedAttributes = selectedAttributes.filter(attr =>
                    attr.attrTypeName != typeName);

                //Add new selected attr of this type
                selectedAttributes.push({
                    attrTypeName: attr.type.name,
                    attrId: attr.id,
                    children: []
                });
            });
        };

        var findRootTypes = function(attrTypeDeps) {
            // Return types that have no parents within the attrs of this AttributeSelector
            const presentTypes = Object.keys(groupedAttrs);
            const childToDep = util.indexList(attrTypeDeps, (dep) => dep.child.name);
            const neededDeps = presentTypes.filter(typeString => childToDep[typeString])
                                        .map(typeString => childToDep[typeString]);
            const isPresentMap = {};
            neededDeps.forEach(dep => {
                isPresentMap[dep.parent.name] = false;
                isPresentMap[dep.child.name] = false;
            });
            //so that we can test if an attributeType is present without needing to some each time
            //thus avoiding n^2 time
            presentTypes.forEach(typeString => isPresentMap[typeString] = true);
            return presentTypes.filter(typeString =>
                !childToDep[typeString] || !isPresentMap[childToDep[typeString].parent.name]
            );
        };

        const init = async function() {
            // If this object was given attributes via the constructor, store those in attrP.
            // Otherwise do a GET for all known attributes.
            const attrP = exports.model
                ? Promise.resolve(exports.model)
                : AttrRepo.get();

            const typeDepsP = dal.get("attr/type/deps");
            const attrDepsP = dal.get("attr/deps");
            const ownerP = AttrTypeRepo.getByLabel("Owner");
            const coreP = AttrTypeRepo.getByLabel("Core");

            const [attrs, attrTypeDeps, attrDeps, owners, cores] =
                await Promise.all([attrP, typeDepsP, attrDepsP, ownerP, coreP]);

            ownerTypes = owners;
            coreTypes = cores;

            extraHidden = true;
            canHide = lastThresh = false;

            // Example groupedAttrs structure:
            // {
            //     "AdSize": {
            //         "attr1": (Attribute obj),
            //         "attr2": (Attribute obj)
            //     },
            //     "Publisher": {
            //         "attr17": (Attribute obj)
            //     }
            // }
            groupedAttrs = util.indexList(attrs, attr => attr.type.name, true);
            //index attributes in typelists by id
            Object.keys(groupedAttrs).forEach(function(type) {
                var idMap = {};
                groupedAttrs[type].forEach(function(attribute) {
                    idMap["attr" + util.select(attribute,"id")] = attribute;
                });
                groupedAttrs[type] = idMap;
            });

            rootTypes = findRootTypes(attrTypeDeps);
            // Start selecting an arbitrary root type.
            selectedType = rootTypes[0];

            typeForestMaps = buildTypeForest(attrTypeDeps);

            // Store the attribute dependencies as a map from child attr id to a list of parent attr ids.
            attrDeps.forEach(dep => {
                //if we've already started a list of parents for this dep's child, push the new parent
                //otherwise start a new list
                if(attrParentMap[dep.child.id])
                    (attrParentMap[dep.child.id]).push(dep.parent.id);
                else
                    attrParentMap[dep.child.id] = [dep.parent.id];
            });

            // Populate attrsById
            attrs.forEach(attr =>
                attrsById[attr.id] = attr);
        };
        const initPromise = init();

        exports.reset = function() {
            attrSelectorContainer.empty();
            selectedAttributes = [];
            selected = [];
            render();
        };

        exports.getData = function() {
            return selectedAttributes.map(obj =>
                attrsById[obj.attrId]);
        };

        return exports;
    };
});
