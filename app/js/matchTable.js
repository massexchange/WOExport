define(["jquery",
        "app/util",
        "app/renderer",
        "moment",
        "app/table"], function($, util, Renderer, moment, Table) {
    return function(container, matches) {
        var exports = {
            model: matches,
            container: container
        };

        var columns = [
            {
                name: "Match Date",
                accessor: function(match) { return match.matchedOn; },
                type: "date"
            },
            {
                name: "Flight Date",
                accessor: function(match) { return match.sell.flightDate; },
                type: "date"
            },
            {
                name: "Attributes",
                accessor: function(match) { return match.buy.selectedAttrs.attributes; },
                type: "attrList"
            },
            {
                name: "Ad Placement Price (USD)",
                accessor: function(match) { return match.sell.aparPrice; },
                type: "price"
            },
            {
                name: "Audience Segment Price (USD)",
                accessor: function(match) { return match.sell.asarPrice; },
                type: "price"
            },
            {
                name: "Units",
                accessor: function(match) { return match.amount; },
                type: "number"
            },
            {
                name: "Total Price (USD)",
                accessor: function(match) { return (match.sell.aparPrice + match.sell.asarPrice) * match.amount / 1000.0; },
                type: "price"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);
        var render = exports.render = function() {
            exports.table.render(util.noop);
        };

        return exports;
    };
});
