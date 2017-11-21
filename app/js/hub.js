define(["app/util", "app/hub/topicGraph", "Rx"], function(util, TopicGraph, Rx) {
    var topicGraph = new TopicGraph();

    class Hub {
        constructor(root = "") {
            this.root = root;
        }
        prefix(name) {
            return this.root.length > 0
                ? `${this.root}/${name}`
                : name;
        }
        pub(name, data = {}) {
            if(!name)
                throw new Error("Name cannot be null");

            topicGraph.publish(this.prefix(name), data);
        }
        sub(name, callback, shouldCatchUp = true) {
            if(!name) throw new Error("Name cannot be null");
            if(!callback) throw new Error("Callback cannot be null");

            topicGraph.subscribe(this.prefix(name), callback, shouldCatchUp);
        }
        topic(name, data) {
            const observable = Rx.Observable.fromEventPattern(
                handler => this.sub(name, handler),
                handler => this.unsub(name, handler)
            );

            //publish events sent to subject
            const observer = {
                next: (event = {}) => {
                    event.data = data;
                    this.pub(name, event);
                },
                error: err => console.log(err)
            };

            const subject = Rx.Subject.create(observer, observable);

            return subject;
        }
        unsub(name, callback) {
            if(!name) throw new Error("Name cannot be null");
            if(!callback) throw new Error("Callback cannot be null");

            topicGraph.unsubscribe(this.prefix(name), callback);
        }
        reset(name) {
            if(!name) throw new Error("Name cannot be null");

            topicGraph.clear(this.prefix(name));
        }
        getSubHub(root) {
            return new Hub(this.prefix(root));
        }
    }

    return new Hub();
});
