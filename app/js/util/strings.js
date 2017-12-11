define(["app/util/stringStore", "app/util"], function(stringStore, util) {
    return class Strings {
        static get(key) {
            return util.select(stringStore,
                key.replace(/_/g, "."));
        }
        static get store() {
            return stringStore;
        }
    };
});
