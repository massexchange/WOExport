define(["jquery", "app/util", "app/eventEmitter"], function($, util, EventEmitter) {
    class CSS extends EventEmitter {
        constructor() {
            super();

            this.sheetsByDynamism = {
                true: {},
                false: {}
            };

            this.head = $("head");
        }
        async load(name, dynamic = false) {
            var sheets = this.sheetsByDynamism[dynamic];
            if(sheets[name])
                return;

            try {
                await new Promise((resolve, reject) =>
                    sheets[name] = $("<link>").attr({
                        type: "text/css",
                        rel: "stylesheet",
                        href: `./app/css/${name}.css`
                    })
                    .on("error", e => {
                        e.preventDefault();
                        reject(e);
                    })
                    .load(resolve)
                    .appendTo(this.head));
            } catch(e) {
                this.logger.error(`sheet "${name}" does not exist`);
            }
        }
        unloadDynamic() {
            const dynamicSheets = this.sheetsByDynamism.true;

            Object.entries(dynamicSheets)
                .forEach(([ name, element ]) => {
                    element.remove();
                    delete dynamicSheets[name];
                });
        }
    }

    return new CSS();
});
