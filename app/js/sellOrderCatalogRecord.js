define(["app/util", "app/sellOrderTable", "app/renderer"],
function(util, SellOrderTable, Renderer) {
    return function(container, model, rowFunc, options) {
        var exports = {
            container: container,
            model: model,
            rowFunc: rowFunc,
            options: options
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("sellOrderCatalogRecord");

            const shard = util.getVisibleAttributes(exports.model.shard);

            const attrListRenderer = new Renderer(el.parent().find(".attributes"));
            attrListRenderer.renderTemplate("attrList", { data: shard });

            const tableContainer = el.parent().find(".recordTable");
            const table = new SellOrderTable(tableContainer, [exports.model], exports.rowFunc, exports.options);
            return table.render();
        };

        return exports;
    };
});
