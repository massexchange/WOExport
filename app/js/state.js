define(["Rx", "app/util"], function(Rx, util) {
    return class State {
        constructor(name) {
            this.name = name;
            this.context = {};

            this.isActive = new Rx.BehaviorSubject(false);
            this.activated = this.isActive.filter(util.pipe);
        }
    };
});
