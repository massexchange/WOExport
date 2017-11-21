define(["app/util", "app/renderer", "app/portfolioOrderTable"],
function(util, Renderer, PortfolioOrderTable) {
    return function(container, model, rowFunc) {
        var exports = {
            container: container,
            model: model,
            rowFunc: rowFunc
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("orderGroupRow");

            //render it
            const attrListRenderer = new Renderer(el.parent().find(".attributes"));

            const attrListP = attrListRenderer.renderTemplate("attrList", {
                data: exports.model.selectedAttrs.attributes });

            //render the orders
            const tableContainer = el.parent().find(".orderTable");
            const ordTable = new PortfolioOrderTable(tableContainer, [exports.model], exports.rowFunc);
            const ordTableP = ordTable.render();

            return Promise.all([
                attrListP, ordTableP]);
        };

        return exports;
    };
});
