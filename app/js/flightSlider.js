define(["app/renderer", "app/util", "app/dal", "app/slider"],
function(Renderer, util, dal, Slider) {
    return function(container, model, editable) {
        var exports = {
            container: container,
            model: model
        };

        var internals = {};

        var sliderText = MX.strings.get("flightSlider_sliderText");

        exports.render = function() {
            var renderer = new Renderer(exports.container);

            return renderer.renderTemplate("flightSlider", exports.model).then(function(el) {
                var container = exports.container.find(".slider");
                var type = "percent";
                var options = {
                    container: container,
                    valText: sliderText,
                    textElement: exports.container.find(".sliderValText"),
                    minVal: 0.5,
                    maxVal: 1.5,
                    step: 0.01,
                    defaultVal: 1,
                    type: type
                };
                var slider = internals.slider = new Slider(exports.model.sliderVal, options);
                slider.onChange(util.setterFor(exports.model, "sliderVal"));

                if(editable) {
                    exports.container.find(".delete").removeClass("hidden").click(
                        util.partialLeft(deleteHandler, exports.model)
                    );
                }

                return editable
                    ? slider.render()
                    : slider.render().then(() =>
                        exports.container.find(".slider").prop("disabled", true));
            });
        };

        var deleteHandler = function() {
            exports.container.remove();
        };

        exports.onDelete = function(cb) {
            deleteHandler = util.chain(cb, deleteHandler);
        };

        var getData = exports.getData = function() {
            return exports.model;
        };

        var reset = exports.reset = function() {
            internals.slider.reset();
        };

        return exports;
    };
});
