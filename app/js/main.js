const exporter = nodeRequire("electron").remote.require("./exporter/exporter");

define(["jquery", "app/dal", "app/renderer", "app/topBar", "app/sideBar", "app/historyGroup", "app/util", "app/noty"],
function($, dal, Renderer, TopBar, SideBar, HistoryGroup, util, Noty) {
    const exports = {};
    exports.markets = [];
    exports.elements = {};

    const selectedMatchIDs = [];

    const addMatchId = async () => {
        const id = exports.elements.matchIdInput.val();
        if(selectedMatchIDs.includes(id))
            return;

        const matchExport = await dal.get(`match/${id}/export`);

        const matchContainer = $("<div>");
        const group = new HistoryGroup(matchContainer, matchExport.match, util.noop, exports.markets);
        await group.render();

        exports.elements.selectedMatches.append(matchContainer);
        selectedMatchIDs.push(id);
    };


    const init = async () => {
        const mpMarkets = await dal.get("market", { mpId: MX.session.creds.user.mp.id });
        exports.markets = mpMarkets;
    };

    const validate = (dealName, advName) => {
        const errors = [];

        if(dealName == null || dealName.length == "")
            errors.push("Deal name shouldn't be empty");

        if(advName == null || advName.length == "")
            errors.push("Advertiser name shouldn't be empty");

        return errors;
    };

    exports.render = async container => {
        const renderer = new Renderer(container);

        await init();
        await renderer.render("main");
        await SideBar.render($("#sideBar"));
        await TopBar.render($("#topBar"));

        exports.elements.matchIdInput = $("#matchIdInput");
        exports.elements.matchIdAdd = $("#matchIdAdd");
        exports.elements.selectedMatches = $("#selectedMatches");

        exports.elements.matchIdAdd.click(addMatchId);
        $("#export").click(() => {
            Noty.closeAll();
            const dealName = $("#dealName").val();
            const advName = $("#advertiserName").val();

            const errors = validate(dealName, advName);
            if(errors.length > 0)
                return util.displayErrors(errors);

            exporter.exportMatches(selectedMatchIDs, MX.session.creds.token, dealName, advName);
        });
    };

    return exports;
});
