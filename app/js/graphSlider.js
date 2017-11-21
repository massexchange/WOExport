define(["app/renderer", "app/util", "app/slider"],
function(Renderer, util, Slider) {
    return function(model, options) {
        var exports = {
            model: model
        };

        //TODO: properly implement control subclassing

        var slider;

        var init = function() {
            slider = Slider(exports.model.day, Object.assign(options, {
                valText: "",
                minVal: 30,
                maxVal: 0,
                step: 1,
                showScale: false,
                disableDefaultHandler: true
            }));
        };
        init();
        exports = Object.assign({}, slider, exports);

        exports.setGraphVal = function(val) {
            exports.model.day = val;
            exports.set(val);
            exports.setText(val);
        };

        const onRender = function(el) {
            const container = el.parent();

            slider.setOptions({
                textElement: container.find(".daysToFlight"),
                container: container.find(".sliderContainer")
            });

            return slider.render();
        };

        exports.render = async function() {
            const renderer = new Renderer(exports.config.container);
            const el = await renderer.renderTemplate("graphSlider", exports.model);

            return onRender(el);
        };

        return exports;
    };
});
