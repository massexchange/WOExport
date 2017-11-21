define(["app/hub"], function(rootHub) {
    var levels = ["trace", "debug", "info", "warn", "error"];
    class Logger {
        constructor(name, ownerHub) {
            this.name = name;
            this.hub = ownerHub.getSubHub("log");
        }
        logMessage(level, message) {
            this.hub.pub(level, message);
            rootHub.pub(`log/${this.name}/${level}`, `${this.name}: ${message}`);
        }
    }

    var logger = level => function(message) {
        this.logMessage(level, message);
    };
    levels.forEach(level => Logger.prototype[level] = logger(level));

    return Logger;
});
