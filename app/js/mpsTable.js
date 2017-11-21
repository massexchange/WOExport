define(["app/util", "app/renderer", "app/table"],
function(util, Renderer, Table) {
    return function(container, mps, rowFunc) {
        var exports = {
            model: mps,
            container: container,
            rowFunc: rowFunc
        };

        var columns = [
            {
                "name": "",
                "accessor": function(mp) { return mp.name; },
                "type": "string"
            },
            {
                "name": "",
                "accessor": function(mp) { return " "; /*behaviour is handled elsewhere*/ },
                "type": "removeButton"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = function() {
            if(exports.model.length > 0)
                return exports.table.render(exports.rowFunc);
            else {
                exports.container.empty().text(MX.strings.get("mpsTable_noMps"));
            }
        };

        return exports;

    };
});
