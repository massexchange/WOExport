define(["app/renderer"], function(Renderer) {
    return class Exception {
        constructor(container, model) {
            this.container = container;
            this.model = model;

            this.model.details.stackTrace = this.model.details.stackTrace
                .filter(({ className }) =>
                    className.includes("com.massexchange"));
        }
        async render() {
            const renderer = new Renderer(this.container);
            await renderer.renderTemplate("exception", this.model);
            this.container.find(".exception-stack")
                .click(function() {
                    $(this).find(".exception-stack-calls")
                        .toggleClass("hidden");
                });
        }
    };
});
