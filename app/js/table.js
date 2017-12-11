define(["jquery", "app/util", "app/renderer", "floatThead"],
function($, util, Renderer) {
    /*
        USAGE:

        Renders tables.

        Arguments:
            container: div where the table is to be rendered
            model: array of elements to show on the table
            columns: array of Column definitions

        Column:
            name: header, ie "Impressions"
            accessor: function, retrieves column value from element
            type: string, specifies template to use
    */
    return class Table {
        constructor(container, model, columns, ...options) {
            this.model = model;
            this.container = container;
            this.columns = columns;

            this.options = options;
            this.options.floatHeader = false;
        }
        renderRow(rowFunc) {
            return async rowModel => {
                const rowData = {
                    columns: this.columns.map(({ accessor, type }) => ({
                        data: accessor(rowModel), type
                    }))
                };

                const row = $("<tr>")
                    .addClass("row")
                    .toggleClass("clickable", !!this.options.clickable);

                const rowRenderer = new Renderer(row);
                const el = await rowRenderer.render("tableRow", rowData);

                const rowFuncP = rowFunc(el, rowModel);
                //legacy compatability hack
                await (rowFuncP || Promise.resolve());

                return el;
            };
        }
        /* rowFunc: (rowEl, rowModel) */
        async render(rowFunc = util.pipeP) {
            const tableHeadRenderer = new Renderer(this.container);

            const table = await tableHeadRenderer.render("table", this.columns);

            const tbody = table.parent().find("tbody");

            const rowEls = await Promise.all(
                this.model.map(
                    this.renderRow(rowFunc)));

            const rows = rowEls.map(x => x.parent());

            tbody.append(rows);

            if(this.options.floatHeader)
                table.floatThead({
                    scrollContainer: util.constant(this.container),
                    position: "fixed",
                    debug: true
                });

            return table;
        }
        /* rowFunc: (rowEl, rowModel) */
        async addItem(item, rowFunc = util.pipe) {
            this.model.push(item);
            if(this.model.length == 0)
                return this.render(rowFunc);

            const tbody = $(this.container).find("tbody");

            const el = await this.renderRow(rowFunc)(item);
            return tbody.append(el.parent());
        }
    };
});
