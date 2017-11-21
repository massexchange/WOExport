define(["app/util", "app/renderer", "app/list", "app/matchSummaryTable"],
function(util, Renderer, List, MatchSummaryTable) {
    return function(container, model) {
        var exports = {
            container: container,
            model: model
        };

        exports.render = async () => {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("assetGroupedList");

            const attributeBar = new Renderer(el.parent().find(".attributes"));
            const attrBarP = attributeBar.renderTemplate("attrList", { data: exports.model.key.attributes });

            const tableContainer = el.parent().find(".groupedElementsTable");

            const matchTable = new MatchSummaryTable(tableContainer,
                exports.model.value);
            const matchP = matchTable.render();

            return Promise.all([
                attrBarP, matchP]);
        };

        return exports;
    };
});
