define(["jquery", "app/util", "app/dal", "app/table"], 
function($, util, dal, Table) {
    return function(container, model, rowFunc) {
        exports = {
            "container": container,
            "model": model,
            "rowFunc": rowFunc
        };

        

        var columns = [
            {
                "name": "Name",
                "accessor": util.partialRight(util.select, "name"),
                "type": "string"
            },
            {
                "name": "Role",
                "accessor": util.partialRight(util.select, "role"),
                "type": "string"
            },
            {
                "name": "Website",
                "accessor": util.partialRight(util.select, "website"),
                "type": "string"
            },
            {
                "name": "Status",
                "accessor": util.partialRight(util.select, "status"),
                "type": "string"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = function() {
            if(exports.model.length > 0) //don't render an empty table
                exports.table.render(exports.rowFunc);
            else {
                container.empty().text(MX.strings.get("mpManagementTable_noMps"));
            }
        };

        return exports;
    };
});
