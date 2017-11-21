define(["app/renderer", "app/util", "app/dal", "app/repo/attr", "app/dropdown"],
function(Renderer, util, dal, AttrRepo, Dropdown) {
    return function(selected, container, typesSet, maxSelectionCount) {
        // KEEP IN MIND: maxSelectionCount might sometimes be undefined.

        var renderer = new Renderer(container);

        var exports = {};

        var dropdownAnyText = MX.strings.get("attrTypeSel_dropdownAny");

        const init = async function() {
            exports.selectedTypes = [];
            exports.dropdowns = [];

            if(util.isDefined(typesSet)) {
                // Case where constructor param specifies a subset of Attr Types.
                exports.model = typesSet;
                return Promise.resolve();
            }

            // Default, get attribute cache by mp
            const cachesResult = await dal.get("attrCache", {
                mpId: MX.session.creds.user.mp.id });

            exports.model = cachesResult
                .filter(cache =>
                    cache.type.category == "ASAR")
                .map(({ type }) => type);
        };
        const initPromise = init();

        exports.getData = function() {
            return exports.dropdowns
                .map(({ selected: { item } }) => item)
                .filter(util.isDefined);
        };

        const addDropdown = async function(selectedType) {
            const ddTypes = exports.model.filter(knownType =>
                // Filter out the selected types (apart from the current one).
                knownType == selectedType ||
                    exports.selectedTypes.indexOf(knownType) == -1);

            if(ddTypes.length == 0)
                return;

            const dropdownDiv = $("<div>");
            container.append(dropdownDiv);

            const dropdown = new Dropdown(ddTypes, {
                container: dropdownDiv,
                promptText: dropdownAnyText,
                textField: "name"
            });
            await dropdown.render();

            if(util.isDefined(selectedType))
                // Make the dropdown select this type, without triggering a change
                dropdown.selectByVal(selectedType.id, false);

            // Whenever a dropdown selection changes, save the selectedTypes & rerender the whole Selector.
            dropdown.change.subscribe(() => {
                exports.selectedTypes = exports.getData();
                exports.render();
            });

            //"X" button to remove a dropdown
            const xSpan = $("<span>")
                .html("X")
                .addClass("removeAttrTypeDD")
                .appendTo(dropdownDiv);

            xSpan.click(function() {
                if(dropdown.selected != null) {
                    exports.selectedTypes = exports.selectedTypes.filter(type =>
                        type != dropdown.selected.item);
                    exports.render();
                }
            });

            exports.dropdowns.push(dropdown);
        };

        exports.render = async function() {
            await Promise.all([
                renderer.renderView("attributeTypeSelector"),
                initPromise]);

            if(util.isDefined(maxSelectionCount) &&
                    exports.selectedTypes.length > maxSelectionCount)
                // If a limit k exists, use only the first k of selected.
                exports.selectedTypes = exports.selectedTypes.slice(0, maxSelectionCount);

            // Clear dropdowns before rebuilding them
            exports.dropdowns.forEach(dropdown =>
                dropdown.unrender());
            exports.dropdowns = [];

            // Make one dropdown for each type that is currently selected
            exports.selectedTypes.forEach(addDropdown);

            if(util.isDefined(maxSelectionCount) &&
                    exports.selectedTypes.length < maxSelectionCount)
                // Also add one blank DD, so user can select more types.
                addDropdown();
        };

        return exports;
    };
});
