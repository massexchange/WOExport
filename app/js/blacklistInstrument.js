define(["jquery", "app/renderer", "app/util"],
function($, Renderer, util) {
    return function(container, model, onDelete) {
        var exports = {
            container: container,
            model: model,
            onDelete: onDelete
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderTemplate("blacklistInstrument");

            el.parent().find(".delete").click(() =>
                onDelete(exports.model, exports.container));

            const attrRenderer = new Renderer(el.parent().find(".attributeList"));

            return attrRenderer.renderTemplate("attrList", {
                data: exports.model.attributes
                    .sort(util.comparator.attribute)
            });
        };

        return exports;
    };
});
