define(["app/util", "app/renderer", "app/table"],
function(util, Renderer, Table) {
    return function(mappings, container, rowFunc) {
        var exports = {
            model: mappings,
            container: container,
            rowFunc: rowFunc
        };

        var columns = [
            {
                "name": "Key",
                "accessor": function(mapping) { return mapping.inputAttribute.key; },
                "type": "string"
            },
            {
                "name": "Value",
                "accessor": function(mapping) { return mapping.inputAttribute.value; },
                "type": "string"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = function() {
            if(exports.model.length > 0)
                return exports.table.render(exports.rowFunc);
            else {
                container.empty().text(MX.strings.get("mappingsTable_empty"));
            }
        };

        return exports;

    };
});
