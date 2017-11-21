define(["jquery", "app/util", "app/hub", "app/viewManager", "app/dal", "app/session", "app/renderer",
"moment", "app/spinner", "app/dropdown", "app/pageControl", "app/list", "app/rawInventory",
"FileSaver", "app/repo/importTask", "app/noty"],
function($, util, hub, ViewManager, dal, Session, Renderer, moment, Spinner, Dropdown, PageControl,
    List, RawInventory, FileSaver, ImportTaskRepo, Noty) {
    var exports = {};

    var controls = {
        TaskDD: {}
    };

    var taskDropdownText = MX.strings.get("importReview_taskDropdownText");
    var taskPurged = MX.strings.get("importReview_taskPurged");
    var taskReady = MX.strings.get("importReview_taskReady");

    var onRender = async function() {
        $("#taskTable").html("");
        $("#pageNav").html("");

        const taskList = await ImportTaskRepo.getForMp(MX.session.creds.user.mp);
        controls.TaskDD = new Dropdown(taskList, {
            container: $("#taskDropdown"),
            promptText: taskDropdownText,
            textField: "importDate"
        });

        var withTask = f => (...args) =>
            f(controls.TaskDD.selected.item, ...args);

        controls.TaskDD.change.subscribe(
            withTask(loadAndRenderTaskPage));
        await controls.TaskDD.render();

        $("#cancel").click(
            withTask(purgeTask));
        $("#process").click(
            withTask(processTask));
        $("#exportToFile").click(
            withTask(exportTask));
        $("#exportRaw").click(
            withTask(createTaskDump));
    };

    const loadAndRenderTaskPage = function(task) {
        const pager = new PageControl({
            container: $("#pageNav"),
            source: new PageControl.Backend({
                endpoint: `acquisition/import/${task.id}`,
                method: "get"
            }),
            list: new List({
                container: $("#taskTable"),
                constructor: RawInventory
            })
        });
        pager.render();
    };

    const purgeTask = async task => {
        await ImportTaskRepo.delete(task);
        Noty.success(taskPurged(task.importDate));

        $("#taskTable").html("");
        $("#pageNav").html("");

        controls.TaskDD.removeByText(task.importDate, true);
    };

    const exportTask = function(task) {
        const reportWindow = window.open("", "Import Task" ,"scrollbars=1");
        const windowBody = $(reportWindow.document.body);
        windowBody.css("height", "initial");
        Spinner.add(windowBody);
        $(reportWindow.document).find("html").css("overflow-y", "initial");
        $(reportWindow.document).find("html").css("height", "initial");

        //Add css files
        var protocolAndHost = window.location.protocol + "//" + window.location.hostname;

        var files = [
            "/lib/css/normalize/normalize.css",
            "/app/css/app.css",
            "/app/css/mobile.css",
            "/lib/css/font-awesome/font-awesome.css",
            "/static/app/css/importReview.css",
            "/static/app/css/attrList.css",
            "/static/app/css/table.css",
            "/static/app/css/number.css",
            "/static/app/css/price.css",
            "/static/app/js/../../lib/css/spinkit/spinkit.css"
        ];

        var genLink = path =>
            $("<link>", {
               rel: "stylesheet",
                type: "text/css",
                href: `${protocolAndHost}/${path}`});

        $(reportWindow.document.head).append(files.map(genLink));

        var rawContainer = $("<div>");

        $(reportWindow.document.body).append(rawContainer);

        return dal.get(`acquisition/export/${task.id}`).then(raws => {
            const rawList = new List({
                container: rawContainer,
                items: raws,
                constructor: RawInventory
            });

            return rawList.render().then(() =>
                Spinner.remove(windowBody));
        });
    };

    var createTaskDump = function(task) {
        dal.get(`acquisition/export/dump/${task.id}`).then(raws => {
            var blob = new Blob([JSON.stringify(raws)], { type: "application/json;charset=utf-8" });
            saveAs(blob, "import.json");
        });
    };

    var processTask = async task => {
        const raws = await dal.post(`acquisition/import/process/${task.id}`);
        Noty.alert(taskReady(task.importDate));
    };

    var render = exports.render = function() {
        ViewManager.renderView("importReview").then(onRender);
    };

    hub.sub("app/route/importReview", render);

    return exports;
});
