define(["app/util", "app/renderer", "app/history"],
function(util, Renderer, History) {
    return function(container, model, rowFunc, markets) {
        var exports = {
            container: container,
            model: model,
            rowFunc: rowFunc,
            markets: markets
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("assetGroupedList");

            //get the attribute list off of the first collapsed catalog record
            //since the records are grouped by shard
            const shard = (exports.model.sell.mp.id == MX.session.creds.user.mp.id
                ? util.getVisibleAttributes(exports.model.sell.catRec.shard)
                : exports.model.buy.selectedAttrs.attributes
            ).sort(util.comparator.attribute);

            //render it
            const attrListRenderer = new Renderer(el.parent().find(".attributes"));
            const attrListP = attrListRenderer.renderTemplate("attrList", { data: shard });

            //render the orders
            const tableContainer = el.parent().find(".groupedElementsTable");
            const histTable = new History(tableContainer, util.wrapIfNeeded(exports.model), exports.rowFunc, exports.markets);

            return Promise.all([
                histTable.render(),
                attrListP
            ]);
        };

        return exports;
    };
});
