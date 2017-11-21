define(["app/util"], function(util) {
    class Topic {
        constructor(name = "") {
            this.name = name;
            this.messages = [];
            this.subscribers = [];
            this.subTopics = {};
        }
        addMessage(data) {
            this.messages.push(data);
            this.subscribers.forEach(sub => sub(data));
        }
        addSubscriber(sub, shouldCatchUp = true) {
            this.subscribers.push(sub);
            if(shouldCatchUp)
                this.messages.forEach(sub);
        }
        removeSubscriber(sub) {
            delete this.subscribers[
                this.subscribers.indexOf(sub)];
        }
        clear() {
            this.messages = [];
        }
    }

    return class TopicGraph {
        constructor() {
            this.rootTopic = new Topic();
        }
        traverseTo(path, action = util.noop) {
            var initialTopics = path.split('/');
            var visit = (obj, topics) => {
                var currentTopic = util.safeSelect(obj, topics[0], Topic);
                action(currentTopic);

                return topics.length == 1
                    ? currentTopic
                    : visit(currentTopic.subTopics, util.tail(topics));
            };

            return visit(this.rootTopic.subTopics, initialTopics);
        }
        publish(target, data) {
            this.traverseTo(target, selectedTopic => {
                if(!util.isObject(data))
                    data = { data };

                data.dest = target;
                selectedTopic.addMessage(data);
            });
        }
        subscribe(target, subscriber, shouldCatchUp = true) {
            this.traverseTo(target).addSubscriber(subscriber, shouldCatchUp);
        }
        unsubscribe(target, subscriber) {
            this.traverseTo(target).removeSubscriber(subscriber);
        }
        clear(target) {
            this.traverseTo(target).clear();
        }
    };
});
