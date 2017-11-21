define(["jquery", "app/renderer", "app/util"],
function($, Renderer, util) {
    return function(model, initialOptions) {
        var exports = {
            model: model
        };

        exports.config = {
            sclass: "",         //class to be applied to slider
            valText: "Value: ", //value prefix
            minVal: 0,          //minimum slider value
            maxVal: 10,         //maximum slider value
            step: 1,            //slider increment
            defaultVal: 5,      //initial/reset value
            type: "integer",    //value number format (decimal, integer, percent)
            showScale: true,    //min/max value visibility
            reverse: false,      //for max < min
            disableDefaultHandler: false
          //textElement:          slider value label
          //container:            control container element
        };

        exports.setOptions = function(options) {
            util.setOptions(exports)(options);

            //adjust bounds
            if(exports.config.minVal > exports.config.maxVal) {
                var min = exports.config.minVal;
                exports.config.minVal = exports.config.maxVal;
                exports.config.maxVal = min;
                exports.config.reverse = true;
            }
        };

        var init = function() {
            exports.setOptions(initialOptions);

            //set default value if needed
            if(typeof exports.config.defaultVal == "undefined")
                exports.config.defaultVal = Math.abs(exports.config.minVal + exports.config.maxVal) / 2;
        };
        init();

        var toRealVal = function(sliderVal) {
            return exports.config.reverse
                    ? exports.config.maxVal - sliderVal
                    : sliderVal;
        };

        var toSliderVal = function(realVal) {
            return exports.config.reverse
                    ? exports.config.maxVal - realVal
                    : realVal;
        };

        exports.setText = function(text) {
            exports.config.textElement.text(text);
        };

        var onSelectChanged = util.noop;
        var changeHandler = () => {
            if(!exports.config.disableDefaultHandler)
            {
                var val = exports.slider.val();

                exports.model = toRealVal((exports.config.type == "integer" ? parseInt : parseFloat)(val));

                if(exports.config.textElement)
                    exports.setText(getText(exports.config.type));
            }

            onSelectChanged(exports.model);
        };

        exports.onChange = function(cb) {
            onSelectChanged = util.chain(onSelectChanged, cb);
        };

        var onRender = function(el) {
            var container = el.parent();

            exports.slider = container.find("input").on("input", changeHandler);

            changeHandler.call();
        };

        exports.render = function() {
            var renderer = new Renderer(exports.config.container);

            return renderer.renderTemplate("slider", {
                config: exports.config,
                model: toSliderVal(exports.model)
            }).then(onRender);
        };

        exports.set = function(val) {
            exports.slider.val(toSliderVal(val)).trigger("input");
        };

        var format = {
            integer: function(x) {
                return exports.config.valText + x;
            },
            percent: function(x) {
                return exports.config.valText + (x * 100).toFixed(0) + "%";
            }
        };
        format.decimal = format.integer;
        var getText = function(type) {
            var typeFormat = format[type];
            if(!typeFormat)
                //yell really really loudly
                throw "Slider type string is invalid";

            return typeFormat(exports.model);
        };

        exports.reset = function() {
            exports.slider.val(exports.config.defaultVal).trigger("input");
            exports.config.textElement.text(getText(exports.config.type));
        };

        return exports;
    };
});
