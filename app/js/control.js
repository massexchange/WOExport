define(["jquery", "app/module", "app/hub", "app/renderer", "app/util", "app/util/render",
"Rx", "app/util/promise", "app/resourceManager"],
function($, Module, hub, Renderer, util, renderUtil, Rx, promiseUtil, ResourceManager) {
    /*
        Control
        base module for UI components

        if it needs to fetch resources, before rendering, call addResources
        if you want to configure the model, look at the options

        Special syntax:
            elements.<id>: selects, memoizes, and returns an element by its ID

        Options:
          * template: dust template name
            selectors: map of element selectors to preselect
            viewModelMapping: allows you to decorate the model with UI-relevant data
            modelMapping: function that takes the resolved resources and returns the model
            useControlId: if true, uses generated element IDs. defaults to false
            renderUpdates: set to true if the control should be rerendered on model updates
            modelSource: an observable source for the model
    */
    return class Control extends ResourceManager(Module) {
        constructor({ container, template, name = template, ...options }) {
            super({
                selectors: {},
                modelMapping: Rx.Observable.of,
                renderUpdates: false,
                useControlId: false,
                template,
                ...options
            });

            this.container = container;
            this.name = name;

            this.createProperty("viewModel");
            var viewModelMapping = this.viewModelMapping;
            if(this.options.useControlId)
                viewModelMapping = util.compose(
                    viewModelMapping,
                    viewModel => ({
                        controlId: this.idCard.id,
                        ...viewModel }));

            this.model.map(viewModelMapping)
                .subscribe(this.viewModel);

            this.addState("Rendered");

            const { Active, Rendered } = this.states;
            this.addTransition("render", {
                from: [Active, Rendered],
                to: Rendered
            });

            const { activate, render } = this.transitions;

            activate.setBaseStep(async () =>
                this.state.context.resources = await this.fetchResources());

            render.setBaseStep(
                this.prepareTemplate);
            // render.addStep(() =>
            //     this.callOnChildren(child =>
            //         child.render));

            this.message = MX.strings.store[this.name];

            //temporary copout, until we have a tree diffing algo
            if(this.options.renderUpdates)
                //on the first render
                Rendered.activated.take(1).subscribe(() =>
                    //each time the status is updated,
                    //besides the inital time
                    this.model.skip(1)
                        //render
                        .subscribe(this.renderUpdate));
        }
        viewModelMapping(model) {
            return model;
        }
        async renderTemplate(viewModel) {
            const renderer = new Renderer(this.container);
            return {
                viewModel,
                result: await renderer.render(
                    this.options.template, viewModel)
            };
        }
        configureElements(viewModel) {
            const controlId = this.options.useControlId
                ? this.idCard.id
                : "";

            //preselect elements once template is rendered
            this.elementCache = renderUtil.selectElements(this.options.selectors, this.container);
            this.elements = new Proxy(this.elementCache, {
                get: (target, name) =>
                    util.safeSelect(target, name, () =>
                        //or select element
                        this.elementCache[name] = $(`#${name}${controlId}`))});

            return viewModel;
        }
        configureResults(viewModel) {
            if(!this.options.resultContainerSelector)
                return viewModel;

            this.resultContainer = this.elements[this.options.resultContainerSelector];

            //set up spinner
            this.spinAction = renderUtil.createActionSpinner(
                this.resultContainer);

            return viewModel;
        }
        async prepareTemplate() {
            const viewModel = await this.viewModel.first().toPromise();

            await this.renderTemplate(viewModel);
            await this.configureElements(viewModel);
            await this.configureResults(viewModel);

            return viewModel;
        }
        async render(container) {
            if(container && container instanceof jQuery)
                this.container = container;

            const state = this.currentState.getValue();

            //this is for compatability with legacy parent modules
            //TODO: remove this when transition pathing is implemented
            await (
                //if this is the first time rendering,
                state !== this.states.Rendered &&
                //and we're not yet active
                state !== this.states.Active
                    //activate first
                    ? this.activate()
                    : promiseUtil.resolved());

            return this.trigger(
                this.transitions.render);
        }
        renderUpdate() {
            //rerender the whole thing for now, by default
            return this.render();
        }
    };
});
