define(["jquery", "app/hub", "app/dal", "app/util", "app/renderer", "app/viewManager", "app/session", "app/spinner",
    "moment-timezone", "app/catalogGroup", "app/dropdown", "app/pageControl", "app/list", "app/queryControl",
    "app/repo/priceAdjustmentGraph", "app/sellDialog", "app/permissionEvaluator",
    "app/repo/attrType", "app/noty", "app/util/render"],
function($, hub, dal, util, Renderer, ViewManager, Session, Spinner, moment, CatalogGroup, Dropdown,
PageControl, List, QueryControl, PAGrepo, SellDialog, permEval, AttrTypeRepo, Noty, RenderUtil) {
    const NetworkSellableSetting = "NetworkSellable";

    moment.tz.add("Etc/UTC|UTC|0|0|");
    moment.tz.setDefault("Etc/UTC");

    const catalogViewer = {
        selectedRecords: {}
    };

    const viewName = "catalogViewer";

    const message = util.viewMessages(viewName);

    var promises = {};
    const render = function() {
        Promise.all([
            ViewManager.renderView("catalogViewer"),
            promises.networkSetting
        ]).then(onRender);
    };

    const init = function() {
        promises.networkSetting = dal.get("settings", {
            name: NetworkSellableSetting
        });
    };
    init();

    const anySelected = () =>
        Object.entries(catalogViewer.selectedRecords)
           .map(([, { value: recs }]) => recs.length)
           .reduce((total, length) => total + length, 0)
               > 0;

    const buildCheckboxHandler = (group, networkSetting) => (html, coll) => {
        //find the checkboxes
        const catRecCB = $(html.find("input")[0]);
        const networkButton = $("#network");
        const sellButton = $("#sell");

        //reselect if needed
        catRecCB.prop("checked",
            Object.entries(catalogViewer.selectedRecords)
                .map(([, { value: recs }]) => recs)
                .reduce((agg, arr) => agg.concat(arr), [])
                .some(({ id }) =>
                    id == coll.id));

        //handlers
        catRecCB.change(function() {
            const isChecked = $(this).prop("checked");
            if(isChecked)
                util.safeSelect(catalogViewer.selectedRecords,
                    group.key.id, () => ({
                        key: group.key,
                        value: []
                    })).value.push(coll);
            else {
                const selectedGroup = catalogViewer.selectedRecords[group.key.id];
                selectedGroup.value = selectedGroup.value.filter(rec =>
                    rec.id != coll.id);
            }

            const noneSelected = !anySelected();

            networkButton.prop("disabled",
                !networkSetting.value || noneSelected);

            sellButton.prop("disabled",
                noneSelected);
        });
    };

    const setUpSellButton = (button, constructor) => {
        button.removeClass("hidden").click(() => {
            Noty.closeAll();

            $("#dialogMsg").empty();
            if(anySelected()) {
                const dialog = new constructor(
                    Object.entries(catalogViewer.selectedRecords)
                        .filter(([, { value: recs }]) =>
                            recs.length > 0)
                        //hack so that unchecking doesn't empty list
                        .map(([, { key, value }]) => ({
                            key, value
                        })));

                dialog.activate().then(() =>
                    //uncheck all
                    $(".collapsedRecordTable input.checkBox")
                        .filter((i, cb) =>
                            $(cb).prop("checked")).get()
                        .forEach(cb =>
                            $(cb).prop("checked", "").change()));

            } else
                Noty.alert(message("noRecsSelected"));
        });
    };

    const onRender = async function([el, networkSetting]) {
        //unhide these
        $("#find").removeClass("hidden");

        if(permEval.hasPermission(MX.session.creds.user, "ROLE_SALES"))
            $("#sell, #network")
                .removeClass("hidden")
                .prop("disabled", true);

        if(permEval.hasPermission(MX.session.creds.user, "ROLE_SALES")) {
            setUpSellButton($("#sell"), SellDialog);
            // if(networkSetting)
            //     setUpSellButton($("#network"), NetworkDialog);
        }

        //auxillary set up function
        const getDateRange = () => {
            $("#msg").empty();

            //set the date range properly

            const start = moment().utc().startOf("day");

            //start date should be first of the motnh
            if(start.date() != 1)
                start.date(1).add(1, "months");

            //end date should be the last of the month
            const end = moment(start).add(3, "months");

            return {
                start: moment(start).format(MX.dateTransportFormat),
                end: moment(end).format(MX.dateTransportFormat)
            };
        };

        const queryControl = new QueryControl($("#queryContainer"), getDateRange(), {
            revealMatchType: true,
            dateTemplate: "catalogViewerDateRange"
        }, "attrCache");

        const queryP = queryControl.render();

        const pagerRenderCallBack = async () => {
            if((await pager.list.getModel()).length == 0)
                $("<span>")
                    .addClass("error")
                    .text(message("noRecords"))
                    .appendTo($("#msg"));
            else if(pager.state.currentPage == 0 &&
                queryControl.getData().attributes.length != 0)

                $(".attrBar").eq(0).append($("<div>").text("Exact"));
        };

        const catalogGroupConstructor = (html, group, params) =>
            new CatalogGroup({
                container: html,
                model: group,
                rowFunc: buildCheckboxHandler(group, networkSetting),
                ...params
            });

        const pager = new PageControl({
            list: new List({
                container: $("#results"),
                constructor: catalogGroupConstructor
            }),
            container: $("#pageNav"),
            source: new PageControl.Backend({
                endpoint: "catalog",
                method: "get"
            }),
            additionalQueries: {
                graphs: () => PAGrepo.getAll()
            },
            onRenderCallback: pagerRenderCallBack
        });

        const spinQuery = RenderUtil.createActionSpinner($("#queryContainer"));

        //on find page
        const findPage = () => {
            Noty.closeAll();

            $("#msg").empty();
            //check for errors
            const errors = queryControl.validate();
            if(errors.length > 0) {
                util.displayErrors(errors);
                return;
            }

            catalogViewer.selectedRecords = {};

            const queryParams = queryControl.getData();

            pager.requestParams = queryParams;

            $("#pageNav").empty();
            $(".listDiv").empty();

            return spinQuery(pager.render.bind(pager));
        };

        $("#find").click(
            findPage);

        await queryP;

        return findPage();
    };

    hub.sub("app/route/catalogViewer", render);
});
