define(["app/util", "app/control", "app/statusControl", "app/router", "Rx", "app/list"],
function(util, Control, StatusControl, Router, Rx, List) {
    return class StatusList extends List {
        constructor(container) {
            super({
                container,
                initialModel: ["pricing", "matching", "mocking", "acquisition", "unitType"],
                constructor: StatusList.statusConstructor,
                containerClass: "status"
            });
        }
        static statusConstructor(container, name) {
            const control = new StatusControl(name);
            control.container = container;
            return control;
        }
    };
});
