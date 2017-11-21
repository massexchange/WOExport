define(["jquery", "app/renderer"],
function($, Renderer) {
    return class AttributeHider {
        constructor(container, attr, startHidden = false) {
            this.container = container;
            this.renderer = new Renderer(container);
            this.attribute = attr;
            this.hidden = startHidden;
        }
        render() {
            return this.renderer.renderView("attributeHider").then((el) => {
                el = el.parent();
                var checkBox = $(el.find("#visibleBox"));
                checkBox.change(() => this.hidden = !checkBox.prop("checked"));
                checkBox.prop("checked", !this.hidden);
                this.attrRenderer = new Renderer(el.find("#attrLabel"));
                return this.attrRenderer.renderTemplate("attrList", {data: [this.attribute]});
            });
        }
        getData() {
            return {
                attribute: this.attribute,
                hidden: this.hidden
            };
        }
    };
});
