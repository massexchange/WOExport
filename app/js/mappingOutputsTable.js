define(["app/util", "app/renderer", "app/table"],
function(util, Renderer, Table) {
    return function(admins, container, rowFunc) {
        var exports = {
            model: admins,
            container: container,
            rowFunc: rowFunc
        };

        var columns = [
            {
                "name": "Key",
                "accessor": function(output) { return output.key; },
                "type": "string"
            },
            {
                "name": "Value",
                "accessor": function(output) { return output.value; },
                "type": "string"
            },
            {
                "name": "",
                "accessor": function(output) { return null; },
                "type": "removeButton"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns, false);

        var render = exports.render = function() {
            if(exports.model.length > 0)
                exports.table.render(exports.rowFunc);
            else {
                container.empty().text(MX.strings.get("mappingOutTable_empty"));
            }
        };

        return exports;

    };
});
