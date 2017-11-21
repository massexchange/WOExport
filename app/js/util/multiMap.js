define(function() {
    return class MultiMap extends Map {
        get(key) {
            if(!this.has(key))
                this.set(key, []);

            return super.get(key);
        }
    };
});
