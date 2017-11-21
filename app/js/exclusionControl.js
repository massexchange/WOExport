define(["app/renderer", "app/util", "app/slider"],
function(Renderer, util, Slider) {
    return function(container, control) {
        var exports = {
            container: container,
            model: control
        };

        var internals = {};

        var sliderText = MX.strings.get("exclusion_sliderText");
        var fixedPrice = MX.strings.get("exclusion_fixedPrice");
        var variablePrice = MX.strings.get("exclusion_variablePrice");

        exports.render = async function() {
            const renderer = new Renderer(exports.container);

            const el = await renderer.renderTemplate("exclusionControl", exports.model);

            var parent = el.parent();
            var type = "percent";

            //here, the textElement and valtext fields have been purposefully omitted so
            //the default change handler will write to nothing, and the callback supplied
            //below instead does the necessary updates
            var minSlider = internals.minSlider = new Slider(exports.model.minAvailable, Object.assign({
                valText: sliderText,
                textElement: parent.find("#min"),
                container: parent.find("#fixedSlider")
            }, {
                type: type,
                minVal: 0,
                maxVal: 1,
                step: 0.01,
                sclass: "horizontal",
                defaultVal: 0,
                showScale: false
            }));

            var changeHandlerOverride = function(sliderVal) {
                $("#fixedAmount." + exports.model.type.shortName).text(fixedPrice(sliderVal));
                $("#variableAmount." + exports.model.type.shortName).text(variablePrice(sliderVal));
            };

            minSlider.onChange(changeHandlerOverride);
            minSlider.render();
        };

        exports.reset = function() {
            internals.minSlider.reset();
        };

        //return complete json of the control entity
        exports.getData = function() {
            return {
                type: exports.model.type,
                minAvailable: internals.minSlider.model
            };
        };

        return exports;
    };
});
