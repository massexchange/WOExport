define(["jquery", "require", "app/css", "app/util", "dustjs-linkedin", "dust-helper-intl", "dustjs-helpers"],
function($, require, css, util, dust) {
    dust.debugLevel = "DEBUG";
    DustIntl.registerWith(dust);
    dust.onLoad = function(name, cb) {
        require([`text!html/${name}.dust`],
            util.partialLeft(cb, null), cb);

        css.load(name);
    };

    class RendererRegistry {
        constructor() {
            this.elements = [];
            this.renderers = [];
        }
        get(el) {
            var elIndex = util.indexOf(
                this.elements,
                other => util.elEq(other, el));

            return elIndex
                ? this.renderers[elIndex] : undefined;
        }
        add(el, renderer) {
            this.elements.push(el);
            this.renderers.push(renderer);

            return renderer;
        }
    }
    var registry = new RendererRegistry();

    class Renderer {
        constructor(container) {
            if(!container)
                throw new Error("Container is undefined");
            if(!(container instanceof $))
                throw new Error(`Resource ${name} must be a promise or Observable!`);
            if(!container[0])
                throw new Error("Container is document; probably selected too early");

            this.container = container;

            var existing = registry.get(container);
            if(existing)
                return existing;

            registry.add(container, this);
        }
        renderView(name, persistent = true) {
            return this.render(name, {}, persistent);
        }
        render(name, data = {}, persistent = true) {
            css.load(name, !persistent);

            return new Promise((resolve, reject) =>
                require([`text!html/${name}.dust`], template => {
                    dust.renderSource(template, data, (err, html) => {
                        if(err)
                            reject(err);

                        resolve(this.container.html(html).contents());
                    });
                }));
        }
    }
    Renderer.prototype.renderTemplate = Renderer.prototype.render;
    return Renderer;
});
