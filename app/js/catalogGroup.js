define(["app/util", "app/collapsedCatalog", "app/renderer"],
function(util, CollapsedCatalog, Renderer) {
    return class CatalogGroup {
        constructor({ container, model, ...options }) {
            this.container = container;
            this.model = model;

            this.options = {
                subControlConstructor: CollapsedCatalog,
                ...options
            };
        }
        getData() {
            return this.subControl.getData();
        }
        async render() {
            const el = await new Renderer(this.container).renderView("assetGroupedList");
            const shard = util.getVisibleAttributes(this.model.key.shard)
                .sort(util.comparator.attribute);

            //render it
            const attrListRenderer = new Renderer(el.parent().find(".attributes"));
            const attrListP = attrListRenderer.renderTemplate("attrList", { data: shard });

            //render the collapsed record table
            const listContainer = el.parent().find(".groupedElementsTable");
            this.subControl = new this.options.subControlConstructor({
                container: listContainer,
                collapsedRecords: this.model.value
                    .sort(util.comparator.collapsed),
                ...this.options
            });

            return Promise.all([
                attrListP,
                this.subControl.render()]);
        }
    };
});
