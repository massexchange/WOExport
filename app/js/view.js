define(["jquery", "app/control", "app/hub", "app/viewManager", "app/util"],
function($, Control, hub, ViewManager, util) {
    /*
        View
        application view control

        there can only be one active view at a time
        they are activated by routing, and then rendered immediately
        do all the needed configuration, then call .init()

        Options:
          * route: routing pattern
    */
    return class View extends Control {
        constructor({ route, name = route, ...options }) {
            super({
                name, route,
                ...options
            });

            const { routedTo } = this.events;
            const { Active } = this.states;
            const { activate, render } = this.transitions;

            routedTo.subscribe(() =>
                this.trigger(activate));

            Active.activated.mapTo()
                .subscribe(this.render);
        }
        /*
            to be called once all view setup is completed
        */
        init() {
            hub.topic(`app/route/${this.options.route}`)
                .subscribe(this.events.routedTo);
        }
        /*
            overrides control.renderTemplate to
            delegate rendering to the ViewManager
        */
        renderTemplate(viewModel) {
            return ViewManager.activate(this, viewModel);
        }
    };
});
