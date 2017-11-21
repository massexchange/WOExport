define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
    return function(container, tasks, rowFunc) {
        var exports = {
            container: container,
            model: tasks,
            rowFunc: rowFunc
        };

        var columns = [
            {
                name: "Canceled",
                accessor: task => task.cancelled,
                type: "string"
            },
            {
                name: "Done",
                accessor: task => task.done,
                type: "string"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);
        var render = exports.render = function() {
            exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
