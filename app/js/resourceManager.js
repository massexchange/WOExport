define(["jquery", "Rx", "app/util", "app/util/promise"], function($, Rx, util, PromiseUtil) {
    return (superclass = Object) =>
    /*
        ResourceManager
        mixin for adding resource management to a module

        Special syntax:
            resources.<name>: allows you to work with resources at any point in the lifecycle
            resource$s.<name>: same, but for resource streams
    */
    class ResourceManager extends superclass {
        constructor(...args) {
            super(...args);

            const resourcePs = {};
            //instantiate "this.resources.<name>" syntax
            this.resources = new Proxy(resourcePs, {
                get: (target, name) => {
                    var existing = resourcePs[name];
                    if(existing)
                        return existing.promise;

                    const deferred = resourcePs[name] = PromiseUtil.defer();

                    return deferred.promise;
                },
                set: (target, name, promise) => {
                    //get or create the virtual promise
                    var existing = resourcePs[name];
                    if(!existing)
                        existing = resourcePs[name] = PromiseUtil.defer();

                    //wire it up to the real one
                    promise.then(existing.resolve);

                    return true;
                }
            });

            this.resourceFetchers = [];

            //TODO: merge these if/when resources are
            //decided to all be observables
            const resource$s = {};
            this.resources$ = new Proxy(resource$s, {
                get: (target, name) =>
                    //get existing subject
                    util.safeSelect(target, name, () =>
                        //or create virtual promise
                        resource$s[name] = new Rx.ReplaySubject(1)),
                set: (target, resourceStreamName, stream) => {
                    //if subject exists
                    const subject = resource$s[resourceStreamName];
                    if(subject)
                        //wire it up to the stream
                        stream.subscribe(subject);

                    return true;
                }
            });
        }
        /*
            addResources

            expects a function which returns a map of named
            asynchronous resources, either promises or observables

            usage:
            addResources(() => ({
                currentUser: dal.get("/user/current")
            }));
        */
        addResources(fetch) {
            this.resourceFetchers.push(fetch);
        }
        fetchResources() {
            if(!util.hasElements(this.resourceFetchers))
                return Promise.resolve();

            util.flatten(
                this.resourceFetchers
                    .map(util.call)
                    .map(Object.entries)
            ).forEach(([name, resource]) => {
                var registry;

                if(util.isPromise(resource))
                    registry = this.resources;
                else if(util.isObservable)
                    registry = this.resources$;
                else
                    throw new Error(`Resource ${name} must be a Promise or Observable!`);

                registry[name] = resource;
            });

            //resolve resources together with their name
            const resourcePs = Object.entries(this.resources)
                .map(async ([name, promise]) =>
                    [name, await promise]);
            const resource$s = Object.entries(this.resources$)
                .map(([name, stream]) =>
                    stream.map(value => [name, value]).first());

            return Rx.Observable.zip(
                ...resourcePs,
                ...resource$s
            ).map(util.entriesToMap)
            .first().toPromise();
        }
     };
});
