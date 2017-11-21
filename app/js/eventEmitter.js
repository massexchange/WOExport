define(["Rx", "jquery", "app/hub", "app/util", "app/registry", "app/logger"],
function(Rx, $, Hub, util, Registry, Logger) {
    /*
        EventEmitter
        basic event-emitting component

        Special syntax:
            events.<name>: observables of module events
    */
    return class EventEmitter {
        constructor() {
            this.idCard = Registry.register(new.target.name, this);
            this.hub = Hub.getSubHub(`modules/${this.idCard.id}`);
            this.logger = new Logger(this.idCard.id, this.hub);

            //instantiate "this.events.<name>" syntax
            this.knownEvents = new Map();
            this.events = new Proxy({}, {
                get: (target, eventName) =>
                    util.safeSelect(target, eventName, name => {
                        const event = this.eventObservable(name);
                        this.knownEvents.set(event, true);
                        return event;
                    })
            });
        }
        eventTopic(name) {
            return `events/${name}`;
        }
        eventPromise(name) {
            return new Promise((resolve, reject) =>
                this.hub.sub(this.eventTopic(name),
                    this.bind(resolve)));
        }
        eventObservable(name) {
            return this.hub.topic(
                this.eventTopic(name), name);
        }
    };
});
