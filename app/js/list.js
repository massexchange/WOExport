define(["jquery", "app/util", "app/renderer", "app/control"],
function($, util, Renderer, Control) {
    /**
        Takes a list of items and renders a control for each one

        constructor: a constructor for the subcontrols, taking:
           - a container element
           - an item to be rendered
    */
    return class List extends Control {
        constructor({ container, items, ...options }) {
            super({
                container,
                template: "list",
                initialModel: items,
                selectors: {
                    listDiv: ".listDiv"
                },
                ...options
            });

            this.params = {};

            this.transitions.render.addStep(
                this.initChildren);
        }
        initChildren(viewModel) {
            this.children = viewModel.map(item => {
                const subContainer = $("<div>")
                    .addClass("listItem")
                    .appendTo(this.elements.listDiv);

                if(this.options.containerClass)
                    subContainer.addClass(this.options.containerClass);

                const params = [subContainer, item, this.params];
                return util.isConstructor(this.options.constructor)
                    ? new this.options.constructor(...params)
                    : this.options.constructor(...params);
            });

            return this.callOnChildren(child =>
                //TODO: this is for compatability with legacy controls
                () => child.render());
        }
    };
});
