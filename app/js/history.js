define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
    return function(container, matches, rowFunc, markets) {
        var exports = {
            container: container,
            model: matches,
            rowFunc: rowFunc,
            markets: markets
        };

        var mpId = MX.session.creds.user.mp.id;
        var mpRole = MX.session.creds.user.mp.role;
        
        var columns = [
            {
                name: "Counterparty",
                accessor: match => mpRole == "ADVERTISER" ? match.sell.mp.name : match.buy.mp.name,
                type: "string"
            },
            {
                name: "Submitted on",
                accessor: match => (match.sell.mp.id == mpId ? match.sell : match.buy).submitted,
                type: "dateLocal"
            },
            {
                name: "Flight",
                accessor: match => match.sell.flightDate,
                type: "date"
            },
            {
                name: "Units",
                accessor: match => match.amount,
                type: "number"
            },
            {
                name: "Placement Price",
                accessor: match => match.matchedAparPrice,
                type: "price"
            },
            {
                name: "Audience Price",
                accessor: match => match.matchedAsarPrice,
                type: "price"
            },
            {
                name: "Market",
                accessor: ({ sell: { marketId } }) => {
                    var market = exports.markets.filter(market =>
                        market.id == marketId);

                    return util.hasElements(market)
                        ? market[0].name
                        : "Unknown";
                },
                type: "string"
            },
            {
                name: "Matched On",
                accessor: match => match.matchedOn,
                type: "dateLocal"
            }
        ];

        exports.table = new Table(exports.container, exports.model, columns);
        exports.render = function() {
            return exports.table.render(exports.rowFunc);
        };

        return exports;
    };
});
