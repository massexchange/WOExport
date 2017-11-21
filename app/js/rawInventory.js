define(["app/util", "app/rawInventoryTable", "app/renderer"],
function(util, rawInventoryTable, Renderer) {
    return function(container, model, options) {
        var exports = {
            container: container,
            model: model,
            options: options
        };

        //turns a list of protoattr kvps into a list of attributes
        var remapProtoAttributes = protos =>
            protos.map(proto => ({
                type: {
                    name: proto.key,
                    category: "PROTO"
                },
                value: proto.value
            }));

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("rawInventory");

            //render it
            const protos = remapProtoAttributes(model.attributes)
                .sort(util.comparator.attribute);

            //we have to remap the protoattribute map into a shard.
            const attrListRenderer = new Renderer(el.parent().find(".attributes"));
            const attrListP = attrListRenderer.renderTemplate("attrList", { data: protos });

            //render the collapsed record table
            const tableContainer = el.parent().find(".rawInventoryTable");
            const collTable = new rawInventoryTable(tableContainer, [exports.model], exports.options);
            const collTableP = collTable.render();

            return Promise.all([attrListP, collTableP]);
        };

        return exports;
    };
});
