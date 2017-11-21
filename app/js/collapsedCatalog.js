define(["app/renderer", "app/util", "moment", "app/table"],
function(Renderer, util, moment, Table) {
    const defaultColumns = [
        {
            name: "",
            accessor: collapsed =>
                collapsed,
            type: "checkbox"
        },
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
                collapsed.averageAudiencePrice,
            type: "price"
        },
        {
            name: "Placement Price",
            accessor: collapsed =>
                collapsed.averagePlacementPrice,
            type: "price"
        },
        {
            name: "Units",
            accessor: collapsed =>
                collapsed.quantity,
            type: "number"
        }
    ];

    return class CollapsedCatalog {
        constructor({ container, collapsedRecords, columns = defaultColumns, ...options }) {
            this.model = collapsedRecords;
            this.container = container;

            this.options = options;

            this.table = new Table(this.container, this.model, columns);
        }
        render() {
            return this.table.render(this.options.rowFunc);
        }
    };
});
