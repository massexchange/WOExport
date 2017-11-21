define(["app/renderer", "app/util", "moment", "app/table", "app/collapsedCatalog"],
function(Renderer, util, moment, Table, CollapsedCatalog) {
    const columns = [
        {
            name: "Start",
            accessor: collapsed =>
                collapsed.start,
            type: "date"
        },
        {
            name: "End",
            accessor: collapsed =>
                collapsed.end,
            type: "date"
        },
        {
            name: "Audience Price",
            accessor: collapsed =>
                collapsed.averageAudiencePrice || 0,
            type: "priceInput"
        },
        {
            name: "Placement Price",
            accessor: collapsed =>
                collapsed.averagePlacementPrice || 0,
            type: "priceInput"
        },
        {
            name: "Units",
            //overwritten in the rowFunc
            accessor: util.constant(0),
            type: "impressionInput"
        }
    ];

    return class CollapsedSell extends CollapsedCatalog {
        constructor(options) {
            super({ columns, ...options });
        }
        //TODO: replace with reactive model
        getData() {
            //find the table body
            const tbody = $(this.container.find("tbody"));

            //partially structure the sell dto, the rest is done elsewhere
            return this.model
                .map((item, index) => ({
                    item,
                    row: tbody.find("tr").eq(index)}))
                .map(({ item, row }) => ({
                    quantity: row.find(".impressionInput input").val(),
                    //TODO: this is hack, remove when reactive make happen
                    asarPrice: row.find("input.priceInput").eq(0).val(),
                    aparPrice: row.find("input.priceInput").eq(1).val(),
                    collapsed: {
                        id: item.id,
                        startDate: item.start,
                        endDate: item.end
                    }
                }));
        }
    };
});
