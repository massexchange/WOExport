define(["Rx", "app/util", "app/state", "app/transition", "app/eventEmitter", "app/util/multiMap"],
function(Rx, util, State, Transition, EventEmitter, MultiMap) {
    /*
        StateMachine
        lifecycle-having component

        Special syntax:
            state.<name>: state objects
            transitions.<name>: state transition objects
    */
    class StateMachine extends EventEmitter {
        constructor() {
            super();

            this.states = {
                Loaded: StateMachine.CoreStates.Loaded
            };
            this.transitions = {};

            this.stateTransitions = new MultiMap();

            this.currentState = new Rx.BehaviorSubject(this.states.Loaded);

            this.currentState
                //don't care about Loaded
                .skip(1)
                .distinctUntilChanged()
                .map(state => state.name)
                .subscribe(state =>
                    this.logger.debug(`State: ${state}`));
        }
        get state() {
            return this.currentState.getValue();
        }
        get validTransitions() {
            return [
                ...this.stateTransitions.get(this.state),
                ...this.stateTransitions.get(StateMachine.CoreStates.ANY)
            ];
        }
        addState(name) {
            this.states[name] = new State(name);
        }
        addTransition(name, { from = StateMachine.CoreStates.ANY, to, ...options }) {
            const transition = this.transitions[name] =
                new Transition(name, { to, ...options }, this);

            util.wrapIfNeeded(from).forEach(source => {
                if(!this.stateTransitions.has(source))
                    this.stateTransitions.set(source, []);

                this.stateTransitions.get(source).push(transition);
            });
        }
        async trigger(transition) {
            if(!this.validTransitions.includes(transition))
                throw new Error(`Transition ${transition.name} is not valid from state ${this.current.name}!`);

            this.events.transition.next(transition);
            await transition.trigger();

            //deactivate current state
            this.state.isActive.next(false);

            //activate target state
            this.currentState.next(transition.target);
            transition.target.isActive.next(true);
        }
    }

    const coreStates = ["Loaded", "ANY"];
    StateMachine.CoreStates = util.mapTo(coreStates,
        name => new State(name));

    return StateMachine;
});
