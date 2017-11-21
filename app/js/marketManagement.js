define(["jquery", "app/util", "app/dal", "app/dropdown", "app/viewManager",
    "app/hub", "app/session", "app/table", "app/market", "app/router"],
function($, util, dal, Dropdown, ViewManager, hub, Session, Table, Market, Router) {
    

    var inMarkets;
    var ownMarkets;
    var allMarkets;
    var myMp = MX.session.creds.user.mp;
    var myMpId = myMp.id;

    var notCreator = MX.strings.get("marketManagement_notCreator");
    var notMember = MX.strings.get("marketManagement_notMember");

    var render = function() {
        ViewManager.renderView("marketManagement").then(onRender);
    };

    var makeNew = async function() {
        var newmkt = {
            name: "",
            members: [myMp],
            owner: myMp,
            status: "Active",
            type: "Private",
            id: 0
        };
        Router.navigate("marketManagement/new", false);

        const control = new Market(newmkt);
        control.setRenderer(ViewManager);

        await control.init();
        return control.render();
    };

    var onRender = async function() {
        const markets = await dal.get("market", {mpId: MX.session.creds.user.mp.id});

        allMarkets = markets
            //Filter out Open Market (ID: 1) from dropdown
            .filter(mkt => mkt.id != 1)
            .sort(util.mapCompare(
                ({ name }) => name,
                util.comparator.alpha));

        ownMarkets = allMarkets.filter(mkt =>
            mkt.owner.id == myMpId);

        inMarkets = allMarkets.filter(mkt =>
            mkt.owner.id != myMpId &&
            mkt.members.some(mem =>
                mem.id == myMpId));

        $("#newButton").click(makeNew);

        var ownedTableContainer = $("#ownedTableContainer");
        var inTableContainer = $("#inTableContainer");

        if(ownMarkets.length > 0) {
            var ownedMarketTable = new Table(ownedTableContainer, ownMarkets, createNamedColumnsObject(), true);
            ownedMarketTable.render(rendFunc);
        } else
            ownedTableContainer.text(notCreator);

        if(inMarkets.length > 0) {
            var inMarketTable = new Table(inTableContainer, inMarkets, createNamedColumnsObject(), true);
            inMarketTable.render(rendFunc);
        } else
            inTableContainer.text(notMember);
    };

    var createNamedColumnsObject = function() {
        return [
            {
                name: "Name",
                accessor: function(mkt) { return mkt.name; },
                type: "string"
            },
            {
                name: "Status",
                accessor: function(mkt) { return mkt.status; },
                type: "string"
            },
            {
                name: "Number of Participants",
                accessor: function(mkt) { return mkt.members.length; },
                type: "string"
            }
        ];
    };

    var rendFunc = function(row, mkt) {
        row = row.parent();
        row.click(function() {
            Router.navigate("marketManagement/" + mkt.id, false);
            var control = new Market(mkt);
            control.setRenderer(ViewManager);
            control.init().then(() => control.render());
        });
    };

    hub.sub("app/route/marketManagement", function(e) {
        var path = e.dest.split('/').slice(3).filter((ch) => ch != "");
        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            if(path[0] == "new") {
                makeNew();
                break;
            } else if(!Number.isInteger(parseInt(path[0]))) {
                Router.navigate("marketManagement/", true);
                break;
            }

            dal.get(`market/${path[0]}`).then(function(market) {
                var control = new Market(market);
                control.setRenderer(ViewManager);
                control.init().then(() => control.render());
            });
            break;
        default:
            Router.navigate("marketManagement/", true);
        }
    });
});
