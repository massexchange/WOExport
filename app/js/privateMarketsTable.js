define(["app/util", "app/renderer", "app/table"],
function(util, Renderer, Table) {
    return function(container, markets, rowFunc) {
        var exports = {
            model: markets,
            container: container,
            rowFunc: rowFunc
        };

        var columns = [
            {
                "name": "",
                "accessor": function(market) { return market.name; },
                "type": "string"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = function() {
            if(exports.model.length > 0)
                return exports.table.render(exports.rowFunc);
            else {
                exports.container.empty().text(MX.strings.get("privateMarketsTable_noMarkets"));
            }
        };

        return exports;

    };
});
