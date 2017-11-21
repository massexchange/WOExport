define(["app/renderer", "app/util", "app/slider"],
function(Renderer, util, Slider) {
    return function(container, slider, editable) {
        var exports = {
            container: container,
            model: slider
        };

        exports.model.inst.attributes = exports.model.inst.attributes
            .sort(util.comparator.attribute);

        var internals = {};

        var sliderValText = MX.strings.get("attrSlider_valText");

        exports.render = async function() {
            var renderer = new Renderer(container);
            const el = await renderer.renderTemplate("attributeSlider", exports.model);

            internals.sliderControl = new Slider(exports.model.sliderVal, {
                container: el.parent().find(".slider"),
                valText: sliderValText,
                minVal: 0.5,
                maxVal: 1.5,
                step: 0.01,
                textElement: el.parent().find(".sliderValText"),
                defaultVal: 1,
                type: "percent"
            });
            internals.sliderControl.onChange(
                util.setterFor(exports.model, "sliderVal"));

            if(editable)
                exports.container.find(".delete").removeClass("hidden")
                    .click(() =>
                        deleteHandler(exports.model));

            return editable
                ? internals.sliderControl.render()
                : internals.sliderControl.render().then(() =>
                    exports.container.find(".slider").prop("disabled", true));
        };

        var deleteHandler = function() {
            exports.container.remove();
        };

        exports.onDelete = function(cb) {
            deleteHandler = util.chain(cb, deleteHandler);
        };

        exports.getData = function() {
            return exports.model;
        };

        exports.reset = function() {
            internals.slider.reset();
        };

        return exports;
    };
});
