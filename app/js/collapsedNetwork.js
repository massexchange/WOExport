define(["app/renderer", "app/util", "moment", "app/table"],
function(Renderer, util, moment, Table) {
    return function(container, collapsedRecords, rowFunc, options) {
        var exports = {
            model: collapsedRecords,
            container: container,
            rowFunc: rowFunc,
            options: options
        };

        var columns = [
            {
                name: "Start",
                accessor: function(collapsed) {
                    return collapsed.startDate;
                },
                type: "date"
            },
            {
                name: "End",
                accessor: function(collapsed) {
                    return collapsed.endDate;
                },
                type: "date"
            },
            {
                name: "Impression Amount",
                accessor: function(collapsed) {
                    return collapsed.quantity;
                },
                type: "impressionInput"
            },
            {
                name: "Price",
                accessor: function(collapsed) {
                    return 0;
                },
                type: "numberField"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        //auxiliary function for fixing the unit types on shard objects
        //fixes deserialization problems with the unit type enums
        var fixUnitType = function(collapsed) {
            var fixed = collapsed;
            fixed.catRecs = collapsed.catRecs.map(function(rec) {
                if(rec.shard.type.name) {
                    //todo: figure out the deep copy
                    rec.shard.type = rec.shard.type.name;
                    rec.shard.ceilingType = rec.shard.ceilingType.name;
                }
                return rec;
            });
            return fixed;
        };

        var getData = exports.getData = function() {
            //find the table body
            var tbody = $(exports.container.find("tbody"));
            //for each entry in the exports.model object, read the impression amount entered
            var sellList = [];
            exports.model.forEach(function(item, idx, arr) {
                var row = $(tbody.find("tr").eq(idx));
                //partially structure the sell dto, the rest is done elsewhere
                sellList.push({
                    qty: row.find("input").eq(0).val(),
                    collapsed: fixUnitType(item),
                    price: row.find("input").eq(1).val()
                });
            });
            return sellList;
        };

        var render = exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };

});
