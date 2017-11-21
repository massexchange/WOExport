define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
    return function(container, processedPerm) {
        var exports = {
            container: container,
            model: processedPerm //Processed "permission" object to include team's name and all perm names as a single string
        };

        var columns = [
            {
                name: "Team",
                accessor: function(perm) { return perm.teamName; },
                type: "string"
            },
            {
                name: "Role",
                accessor: function(perm) { return perm.allRoles; },
                type: "string"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);
        var render = exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
