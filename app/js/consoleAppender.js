define(["app/hub", "app/util"], function(hub, util) {
    return hub.sub("log", ({ data, dest }) => {
        const level = util.last(dest.split("/")).toUpperCase();
        /*eslint no-console: 0*/
        console.log(`${level} - ${data}`);
    });
});
