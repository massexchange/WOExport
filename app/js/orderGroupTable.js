define(["app/util", "app/renderer", "moment", "app/table", "app/dal"],
function(util, Renderer, moment, Table, dal) {
    return function(container, orders, rowFunc, showStatus) {
        var exports = {
            container: container,
            model: orders,
            rowFunc: rowFunc
        };

        var marketList;

        var columns = [
            {
                name: "Flight Start",
                accessor: order => order.flightStartDate,
                type: "date"
            },
            {
                name: "Flight End",
                accessor: order => order.flightEndDate,
                type: "date"
            },
            {
                name: "Filled Quantity",
                accessor: order => order.filledQty,
                type: "number"
            },
            {
                name: "Requested Quantity",
                accessor: order => order.qty,
                type: "number"
            },
            {
                name: "Placement Price",
                accessor: order => order.aparPrice,
                type: "price"
            },
            {
                name: "Audience Price",
                accessor: order => order.asarPrice,
                type: "price"
            },
            {
                name: "Market",
                accessor: order =>
                    marketList.filter(market =>
                        market.id == order.marketId
                    )[0].name,
                type: "string"
            },
            {
                name: "Select",
                accessor: function(order) { return order; },
                type: "checkbox"
            }
        ];

        columns.unshift(
            showStatus
                ? {
                    name: "Status",
                    accessor: ({ status }) => status,
                    type: "string"
                }
                : {
                    name: "Submitted",
                    accessor: ({ submitted }) => submitted,
                    type: "date"
                });

        exports.table = new Table(exports.container, exports.model, columns);
        exports.init = async function() {
            marketList = await dal.get("market", {
                mpId: MX.session.creds.user.mp.id});
        };

        exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
