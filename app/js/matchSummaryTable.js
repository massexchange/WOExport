define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
    return function(container, matchDTOs) {
        var exports = {
            container: container,
            model: matchDTOs
        };

        var columns = [
            {
                name: "Counterparty",
                accessor: ({counterParty}) => counterParty,
                type: "string"
            },
            {
                name: "Submitted On",
                accessor: ({submittedDate}) => submittedDate,
                type: "date"
            },
            {
                name: "Flight",
                accessor: ({flightDate}) => flightDate,
                type: "date"
            },
            {
                name: "Units",
                accessor: ({quantity}) => quantity,
                type: "number"
            },
            {
                name: "Placement",
                accessor: ({aparPrice}) => aparPrice,
                type: "price"
            },
            {
                name: "Audience",
                accessor: ({asarPrice}) => asarPrice,
                type: "price"
            },
            {
                name: "Market",
                accessor: ({marketName}) => marketName,
                type: "string"
            },
            {
                name: "Matched On",
                accessor: ({matchedOn}) => matchedOn,
                type: "date"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);

        var render = exports.render = () => exports.table.render();

        return exports;
    };
});
