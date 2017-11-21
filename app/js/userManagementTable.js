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
                "accessor": function(user) {
                    return user.firstName + ' ' + user.lastName;
                },
                "type": "string"
            },
            {
                "name": "Username",
                "accessor": function(user) {
                    return user.username;
                },
                "type": "string"
            },
            {
                "name": "Email",
                "accessor": function(user) {
                    return user.email;
                },
                "type": "string"
            },
            {
                "name": "Status",
                "accessor": function(user) {
                    return user.status;
                },
                "type": "string"
            }
        ];

        if(MX.session.creds.user.mp.role == "PUBLISHER")
        {
            exports.model.sort(function(a, b) { return util.comparator.numeric(a.perms[0].permission.id, b.perms[0].permission.id); });
            var roleColumn = {
                "name": "Role",
                "accessor": function(user) { return user.perms[0].permission.readableName; },
                "type": "string"
            };
            columns.splice(columns.length - 1, 0, roleColumn);
        }

        exports.table = new Table(exports.container, exports.model, columns, true);

        var render = exports.render = function() {
            if(exports.model.length > 0)
                exports.table.render(exports.rowFunc);
            else {
                container.empty().text(MX.strings.get("userManageTable_noUsers"));
            }
        };

        return exports;
    };
});
