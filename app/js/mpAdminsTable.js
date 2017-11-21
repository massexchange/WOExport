define(["app/util", "app/renderer", "app/table"],
function(util, Renderer, Table) {
    return function(admins, container, rowFunc) {
        var exports = {
            model: admins,
            container: container,
            rowFunc: rowFunc
        };

        var noAdmins = MX.strings.get("mpAdminsTable_noAdmins");

        var columns = [
            {
                "name": "",
                "accessor": function(user) { return user.username; },
                "type": "string"
            },
            {
                "name": "",
                "accessor": function(user) { return " "; /*behaviour is handled elsewhere*/ },
                "type": "removeButton"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = function() {
            if(exports.model.length > 0) //don't render an empty table
                exports.table.render(exports.rowFunc);
            else {
                container.empty().text(noAdmins);
            }
        };

        return exports;

    };
});
