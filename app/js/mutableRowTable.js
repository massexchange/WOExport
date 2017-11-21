define(["jquery", "app/viewManager", "app/hub", "app/util", "app/session", "app/renderer"],
function($, ViewManager, hub, util, Session, Renderer) {
    return class MutableRowTable {
        constructor(container) {
            this.container = container;
            this.data = [];
            this.template = null;
            this.containerProcessor = util.noop;
        }

        async add(element) {
            if(!this.template || !element)
                return;
            const container = $("<div>").addClass(this.template).appendTo(this.container);
            const renderer = new Renderer(container);

            const el = await renderer.renderTemplate(this.template, { data: element });

            this.containerProcessor(container, element);
            this.data.push({
                container,
                model: element
            });
        }
        addAll(set) {
            if(!set || !set.forEach)
                return;
            set.forEach((el) => this.add(el));
        }
        removeByFunc(func) {
            if(!func)
                return;
            var targets = this.data.filter(func);
            targets.forEach((targ) => targ.container.remove());
            this.data = this.data.filter((el) => !func(el));
        }
        removeAll() {
            this.data.forEach((el) => el.container.remove());
            this.data = [];
        }

        setTemplate(template) {
            this.template = template;
        }
        setContainerProcessor(func) {//(container,element) => {}
            this.containerProcessor = func;
        }

        getData() {
            return this.data.map((el) => el.model);
        }
    };
});
