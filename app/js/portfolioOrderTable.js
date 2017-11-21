define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
    return function(container, orders) {
        var exports = {
            container: container,
            model: orders
        };

        var columns = [
            {
                name: "Start",
                accessor: function(order) { return order.flightStartDate; },
                type: "date"
            },
            {
                name: "End",
                accessor: function(order) { return order.flightEndDate; },
                type: "date"
            },
            {
                name: "Units",
                accessor: function(order) { return order.filledQty; },
                type: "number"
            },
            {
                name: "Ad Placement Price (USD)",
                accessor: function(order) { return order.aparPrice; },
                type: "price"
            },
            {
                name: "Audience Segment Price (USD)",
                accessor: function(order) { return order.asarPrice; },
                type: "price"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);
        var render = exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
