define(["jquery", "Noty", "css!../../lib/js/noty/lib/noty"],
function($, noty) {
    /**
        Alerts and Errors are usually important and therefore don't timeout automatically by default
        They have to be clicked by the user to dismiss them

        Success notifications are usually less important and so timeout after 5 seconds by default

        RULES OF THUMB:
        0) Call closeAll() first thing after a save button is clicked
        1) Call closeAll() after something successfully saves as it'll clear prior error/alert boxes
            1a) We don't want to show old error messages if something saved correctly
            1b) Call closeAll() first then success() so only success box is shown
        2) Show a "success" box if an operation completed as expected
        3) Show an "error" box if there's something wrong with user input and operation can't complete as expected
        4) Show an "alert" box if there's something the user should know (that isn't an error or success message)
    */

    return class Noty {
        static show(message, notificationType, timeoutMilli) {
            new noty({
                type: notificationType,
                layout: "bottomRight",
                text: message,
                animation: {
                    open: "noty_effects_open",
                    close: "noty_effects_close"
                },
                theme: "metroui",
                timeout: timeoutMilli
            }).show();
        }
        static closeAll() {
            noty.closeAll();
        }
        static alert(message, timeout) {
            this.show(message, "alert", timeout);
        }
        static error(message, timeout) {
            this.show(message, "error", timeout);
        }
        static success(message, timeout = 5000, closeAll = true) {
            if(closeAll)
                this.closeAll();

            this.show(message, "success", timeout);
        }
    };
});
