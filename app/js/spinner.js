define(["jquery", "app/renderer", "css!../../lib/css/spinkit/spinkit", "css!../../app/css/spinner"],
function($, Renderer) {
    const spinnerClass = "spinner";

    return class Spinner {
        static async add(container) {
            const spinnerDiv = $("<div>").addClass(spinnerClass);
            const renderer = new Renderer(spinnerDiv);

            // Spinkit wave variant:
            await renderer.renderTemplate("spinnerWave");
            container.append(spinnerDiv);
        }
        static remove(container) {
            $(`.${spinnerClass}`, container).remove();
        }
    };
});
