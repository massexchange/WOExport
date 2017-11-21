define(["jquery", "app/hub", "app/router", "app/viewManager", "app/util", "app/renderer", "moment", "app/session",
    "app/campTable", "app/campaign",  "app/orderGroup", "app/repo/campaign", "app/permissionEvaluator"],
function($, hub, Router, ViewManager, util, Renderer, moment, Session, CampTable, Campaign, OrderGroup, CampaignRepo, permEval) {
    var components = {};
    var model;
    var rawCampaigns;
    var mpId;

    var allowedToCreate = permEval.hasPermission(MX.session.creds.user, "ROLE_TEAM_ADMIN")
                    || permEval.hasPermission(MX.session.creds.user, "ROLE_BUYER")
                    || permEval.hasPermission(MX.session.creds.user, "ROLE_PLANNER");

    var rowCampaignFunc = function(row, campaign) {
        row.click(function() {
            Router.goDeeper(campaign.id, true);
        });
    }

    var createCampaign = () => {
        var control = new Campaign({orderGroups: []}, rawCampaigns, mpId, $("#content-column"));
        control.setRenderer(ViewManager);
        control.init().then(() => control.render());
    };

    var render = function() {
        var page = ViewManager.renderView("campaigns").then(function(el) {
            var createCamp = $("#createCamp");
            // normally .sort() results in least to greatest
            // we want the reverse order, so reverse the comparator
            var campCompare = (a, b) => a.id > b.id ? -1
                : a.id == b.id ? 0
                    : 1;

            var activeCampaigns = rawCampaigns
                .sort(campCompare)
                .filter(camp => camp.status == "Active");
            var inactiveCampaigns = rawCampaigns
                .sort(campCompare)
                .filter(camp => camp.status != "Active");
            if(activeCampaigns.length > 0) {
                components.table = new CampTable($("#campaigns"), activeCampaigns, rowCampaignFunc);
                components.table.render();
            } else
                $("#msg").append("You currently have no saved campaigns");

            if(inactiveCampaigns.length > 0) {
                var inactiveTable = $("#inactiveCampaigns");
                components.inactiveTable =  new CampTable(inactiveTable, inactiveCampaigns, rowCampaignFunc);
                components.inactiveTable.render();
                $("#inactiveContainer").removeClass("hidden");

                var inactiveButton = $("#inactiveButton");
                inactiveButton.click(() => {
                    if(inactiveTable.hasClass("hidden")) {
                        inactiveTable.removeClass("hidden");
                        inactiveButton.val("HIDE");
                    } else {
                        inactiveTable.addClass("hidden");
                        inactiveButton.val("VIEW");
                    }
                });
            }

            if(allowedToCreate) {
                createCamp.removeClass("hidden").click(function() {
                    Router.goDeeper("new", true);
                });
            }
        });
    };

    var campaigns = "app/route/campaigns";
    hub.sub(campaigns, function({ path }) {
        var mpId = MX.session.creds.user.mp.id;

        var doRoute = () => {
            switch(path.length) {
            case 1:
                render();
                break;
            case 2:
                var id = path[1];
                if(model.hasOwnProperty(id)) {
                    var control = new Campaign(model[id], rawCampaigns, mpId, $("#content-column"));
                    control.setRenderer(ViewManager);
                    control.init().then(() => control.render());
                } else if(path[1] == "new")
                    createCampaign();
                else
                    Router.navigate("campaigns", true);
                break;
            case 4:
                var campId = path[1];
                var groupId = path[3];
                var failToFind = false;
                if(model.hasOwnProperty(campId)) {
                    var camp = model[campId];
                    var group = util.whereEq(camp.orderGroups, "id", groupId)[0];
                    if(group) {
                        var control = new OrderGroup(group, camp);
                        control.setRenderer(ViewManager);
                        control.render();
                    } else if(path[3] == "new") {
                        var control = new OrderGroup({}, camp);
                        control.setRenderer(ViewManager);
                        control.render();
                    } else
                        Router.navigate(`campaigns/${campId}`, true);
                } else if(path[1] == "new")
                    Router.navigate("campaigns/new", true);
                else
                    Router.navigate("campaigns", true);
                break;
            default:
                Router.navigate("campaigns", true);
                break;
            }
        };

        CampaignRepo.getForMp(MX.session.creds.user.mp).then(function(campaigns) {
            rawCampaigns = campaigns;
            model = util.indexList(campaigns, util.idSelector);
            doRoute();
        });
    });
});
