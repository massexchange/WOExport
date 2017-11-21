define(["app/renderer", "app/util", "moment", "app/table"],
function(Renderer, util, moment, Table) {
    return function(container, raws, rowFunc, options) {
        var exports = {
            model: raws,
            container: container,
            rowFunc: rowFunc,
            options: options
        };

        var columns = [
            {
                name: "FlightDate",
                accessor: function(raw) {
                    return raw.date;
                },
                type: "date"
            },
            {
                name: "Units",
                accessor: function(raw) { return raw.quantity; },
                type: "number"
            }
        ];

        // if(exports.options && exports.options.length > 0)
        //     columns = columns.concat(exports.options);

        exports.table = new Table(exports.container, exports.model, columns);

        var init = function() {
            exports.table = new Table(exports.container, exports.model, columns);
            exports.table.model = exports.model;
        };

        var render = exports.render = function() {
            return exports.table.render();
        };

        init();
        return exports;
    };
});
