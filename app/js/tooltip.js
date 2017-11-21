define(["app/util", "tippy", "css!../../lib/js/tippyjs/dist/tippy.css"],
function(util, tippy) {
    return class Tooltip {
        static add(el, message, options = {}) {
            tippy(el.attr("title", message).get(), {
                position: "top",
                animation: "shift",
                arrow: true,
                ...options
            });
        }
    };
});
