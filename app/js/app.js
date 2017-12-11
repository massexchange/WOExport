define(["require", "jquery", "app/util", "app/hub", "app/session", "Rx", "app/util/promise", "app/consoleAppender", "moment", "app/util/strings", "app/noty"],
function(require, $, util, hub, Session, Rx, PromiseUtil, ConsoleAppender, Moment, Strings, Noty) {
    window.MX = {
        session: Session,
        strings: Strings,
        message: Strings.store.MX,
        require: (name, init = (module => window[name] = module)) => require([name], init),
        dateTransportFormat: "YYYY-MM-DDTHH:mm:ss.SSSZZ"
    };

    window.addEventListener("unhandledrejection", event => {
        const { reason, timestamp } = event;
        const { stack, errors, message } = reason;

        if(!reason.show)
            throw reason;

        //if it was thrown on locally, and there's no message
        if(stack && !errors) {
            Noty.error(MX.message.error.client);
            throw reason;
        }

        (errors || [message]).forEach(error =>
            Noty.error(error));

        event.preventDefault();
    });

    window.MXError = class MXError extends Error {
        constructor({ errors, show = true }) {
            super();

            this.errors = errors;
            this.show = show;
        }
    };

    window.moment = Moment;
    window.noty = Noty;
    window.Rx = Rx;

    const renderMain = () =>
        new Promise((resolve, reject) =>
            require(["app/main"], main =>
                main.render($("#wrapper"))
                    .then(resolve), reject));

    Session.get()
        .then(renderMain);
        
        renderMain();
});
