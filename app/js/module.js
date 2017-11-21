define(["app/util", "Rx", "app/stateMachine", "app/state", "app/util/promise"],
function(util, Rx, StateMachine, State, promiseUtil) {
    /*
        Module
        base class for managed components

        if it needs to fetch resources, before rendering, call addResources
        if you want to configure the model, look at the options
        at least one of them must be set; if you don't know what, hasModel

        Options:
            hasModel: set to false if activation shouldn't wait for the model
            initialModel: a value the model should be initialized to
            modelSource: an observable source for the model
    */
    return class Module extends StateMachine {
        constructor(options = {}) {
            super();

            this.options = {
                hasModel: true,
                ...options
            };

            //pre-bind methods
            this.bind = util.bind(this);
            util.getMethods(this).map(([name, method]) =>
                this[name] = this.bind(method));

            this.createProperty("model");

            this.addState("Active");
            const { Loaded, Active } = this.states;

            this.addTransition("activate", {
                from: Loaded,
                to: Active
            });
            this.addTransition("deactivate", {
                to: Loaded,
                flushContext: true
            });

            const { activate, deactivate } = this.transitions;

            this.intervals = [];
            deactivate.addStep(() =>
                this.intervals.forEach(clearInterval));

            this.children = {};
            activate.addStep(() =>
                this.callOnChildren(child =>
                    child.activate));
            deactivate.addStep(() =>
                this.callOnChildren(child =>
                    child.deactivate));

            activate.addStep(
                this.initModel);

            //log all module events at debug level
            // this.hub.sub("events", ({ data: name }) =>
            //     this.logger.debug(`${this.idCard.id}: ${name} triggered`));
        }
        callOnChildren(method) {
            return Promise.all(
                Object.values(this.children)
                    .map(method)
                    .filter(util.isDefined)
                    .map(util.call));
        }
        createProperty(name, source, mapping = util.pipe) {
            this[name] = new Rx.ReplaySubject(1);

            if(source)
                source.map(mapping)
                    .subscribe(this[name]);
        }
        setInterval(action, interval) {
            this.intervals.push(
                setInterval(action, interval));
        }
        async initModel() {
            const { modelSource, initialModel } = this.options;

            //wire up the model
            if(modelSource) {
                const modelSubscription = modelSource.subscribe(this.model);

                this.transitions.deactivate.addStep(() =>
                    modelSubscription.unsubscribe());
            } else if(initialModel)
                this.model.next(initialModel);
            else
                this.logger.warn("no model, is this correct?");

            if(modelSource || initialModel) {
                //we're not done activating until
                //the model is updated for the first time
                const model = await this.model.first().toPromise();

                this.state.context.model = model;

                return model;
            }
        }
        getModel() {
            return this.model.first().toPromise();
        }
        activate() {
            return this.trigger(
                this.transitions.activate);
        }
        deactivate() {
            return this.trigger(
                this.transitions.deactivate);
        }
    };
});
