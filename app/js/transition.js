define(["Rx", "app/util", "app/util/promise"], function(Rx, util, PromiseUtil) {
    return class Transition {
        constructor(name, { from, to, baseStep = util.constantP(), ...options }, owner) {
            this.name = name;
            this.owner = owner;
            this.target = to;

            this.options = {
                flushContext: false,
                ...options
            };

            this.baseStep = baseStep;
            this.steps = [];
            this.deps = [];
        }
        addSteps(builder) {
            builder.call(this)
                .forEach(this.addStep);
        }
        setBaseStep(step) {
            this.baseStep = step;
        }
        addStep(step) {
            this.steps.push(step);
        }
        async trigger() {
            //run base step
            const baseStepResult = await this.baseStep.call(this.owner);

            //run steps
            this.deps = this.steps
                .map(step =>
                    step.call(this.owner, baseStepResult))
                .map(util.mapIf(
                    stepReturn =>
                        //if the step did not return a promise
                        !stepReturn || !util.isPromise(stepReturn),
                    //it's sync, so resolve now
                    PromiseUtil.resolved))
                .map(util.mapIf(
                    util.isObservable,
                    dep =>
                        dep.toPromise()));

            const depResults = await Promise.all(this.deps);

            this.target.context = !this.options.flushContext
                ? this.owner.state.context
                : {};

            this.deps.length = 0;
            return depResults;
        }
    };
});
