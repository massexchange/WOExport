define(["app/renderer", "app/util", "moment", "app/table", "app/dal", "app/permissionEvaluator"],
function(Renderer, util, moment, Table, dal, permEval) {
    

    return function(container, order, rowFunc, options) {
        var exports = {
            model: order,
            container: container,
            rowFunc: rowFunc,
            options: options
        };

        var marketList;

        var columns = [
            {
                name: "Submitted",
                accessor: function(order) {
                    return order.submitted;
                },
                type: "date"
            },
            {
                name: "Flight Date",
                accessor: function(order) {
                    return order.flightDate;
                },
                type: "date"
            },
            {
                name: "Units",
                accessor: function(order) { return order.qty; },
                type: "number"
            },
            {
                name: "Average Placement Price (USD)",
                accessor: function(order) {
                    return order.aparPrice.toFixed(2);
                },
                type: "price"
            },
            {
                name: "Average Audience Price (USD)",
                accessor: function(order) {
                    return order.asarPrice.toFixed(2);
                },
                type: "price"
            },
            {
                name: "Market",
                accessor: function(order) {
                    var market = marketList.filter(function(x) {
                        return x.id == order.marketId;
                    })[0];
                    return market.name;
                },
                type: "string"
            }
        ];

        if(permEval.hasPermission(MX.session.creds.user, "ROLE_SALES")) {
            var selectCol = {
                name: "Select",
                accessor: function(order) { return order; },
                type: "checkbox"
            };
            columns.push(selectCol);
        }

        if(exports.options && exports.options.length > 0)
            columns = columns.concat(exports.options);

        exports.table = new Table(exports.container, exports.model, columns);

        exports.init = async function() {
            const marketP = dal.get("market", { mpId: MX.session.creds.user.mp.id });

            const [markets] = await Promise.all([marketP]);

            marketList = markets;
            exports.table = new Table(exports.container, exports.model, columns);
            exports.table.model = exports.model;
        };

        exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
