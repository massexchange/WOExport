define(["app/util", "app/renderer", "app/orderGroupTable"],
function(util, Renderer, OrderGroupTable) {
    return function(container, model, { rowFunc, showStatus }) {
        var exports = {
            container: container,
            model: model,
            rowFunc: rowFunc
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("orderGroupRow");

            const attrListRenderer = new Renderer(el.parent().find(".attributes"));
            const attrListP = attrListRenderer.renderTemplate("attrList", {
                data: exports.model.selectedAttrs.attributes
                    .sort(util.comparator.attribute) });

            //render the orders
            const tableContainer = el.parent().find(".orderTable");
            const ordTable = new OrderGroupTable(tableContainer, [exports.model], exports.rowFunc, showStatus);

            await ordTable.init();

            return Promise.all([
                ordTable.render(),
                attrListP]);
        };

        return exports;
    };
});
