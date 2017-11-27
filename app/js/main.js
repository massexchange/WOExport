

define(["jquery", "app/dal", "app/renderer", "app/topBar", "app/sideBar", "app/historyGroup", "app/util"],
function($, dal, Renderer, TopBar, SideBar, HistoryGroup, util) {
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
    };

    return exports;
});
