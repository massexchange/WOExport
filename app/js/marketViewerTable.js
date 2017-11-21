define(["jquery", "app/util", "app/renderer", "app/table"],
function($, util, Renderer, Table) {
    return function(orderList, type, container) {
        const exports = {};

        exports.model = {
            orderList, type
        };

        exports.container = container;

        const noOrdersFound = MX.strings.get("marketViewerTable_noOrdersFound");

        const columns = [
            {
                name: "Price (USD)",
                accessor: element =>
                    element[type + "Price"].toFixed(2),
                type: "price"
            },
            {
                name: "Units",
                accessor: ({ qty }) => qty,
                type: "number"
            }
        ];

        exports.table = new Table(exports.container, exports.model.orderList, columns);
        const render = exports.render = function() {
            if(exports.model.orderList.length > 0)
                return exports.table.render();

            exports.container.empty()
                .append($("<span>")
                    .text(noOrdersFound));
            return Promise.resolve();
        };

        return exports;
    };
});
