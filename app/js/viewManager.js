define(["jquery", "app/hub", "app/renderer", "app/util", "app/css"], function($, hub, Renderer, util, css) {
    class ViewManager {
        constructor() {
            this.viewStack = [];
            this.currentView = () =>
                //viewStack.join('/');
                util.last(this.viewStack);
        }
        activate(view, model) {
            this.viewStack = [view];
            hub.pub("app/view/current", view);

            return this.render(view.options.template, model);
        }
        //TODO: remove aliases once all views updated
        render(name, data = {}) {
            const viewRenderer = new Renderer($("#content-column"));

            const prevView = this.currentView();
            //don't deactivate current view
            if(prevView && prevView.template != name)
                prevView.deactivate();
            //Destroy current view and unload dynamically loaded css before rendering a new view
            $("#content-column").empty();
            css.unloadDynamic();

            return viewRenderer.render(name, data, false);
        }
    }
    ViewManager.prototype.renderView =
        ViewManager.prototype.renderTemplate =
        ViewManager.prototype.render;

    return new ViewManager();
});
