define(["jquery", "app/util", "app/dal", "app/dropdown", "app/viewManager", "app/hub",
    "app/session", "app/renderer", "app/permissionEvaluator", "app/table", "app/team", "app/router"],
function($, util, dal, Dropdown, ViewManager, hub, Session, Renderer, permEval, Table, Team, Router) {
    

    var getBlankTeam = function() {
        return {
            "name": "",
            "mp": MX.session.creds.user.mp,
            "members": [],
            "campaigns": [],
            "blacklistInstruments": []
        };
    };

    var onRender = function() {
        if(permEval.hasPermission(MX.session.creds.user, "MP_ADMIN")) {
            $("#saveButton").removeClass("hidden");
            $("#saveButton").click(() => {
                var team = getBlankTeam();
                Router.navigate("teamManagement/new", false);
                var teamControl = new Team(team, true);
                teamControl.setRenderer(ViewManager);
                teamControl.render();
            });
        }

        var teamP = dal.get("team");
        teamP.then((teams) => {
            teams.forEach((team) => delete team.campaigns); //TODO: find way to not send back unneeded data in backend
            var teamTable = new Table($("#teamTable"), teams, createColumnsObject(), true);
            if(teams.length > 0)
                teamTable.render(rowFunc);
            else
                $("#teamTable").text(MX.strings.get("teamManage_noTeams"));
        });
    };

    var createColumnsObject = function() {
        return [{
            name: "",
            accessor: function(team) { return team.name; },
            type: "string"
        }];
    };

    var rowFunc = function(row, team) {
        row.click(() => {
            Router.navigate(`teamManagement/${team.id}`, false);
            var teamControl = new Team(team);
            teamControl.setRenderer(ViewManager);
            teamControl.render();
        });
    };

    var render = function() {
        ViewManager.renderView("teamManagement").then(onRender);
    };

    hub.sub("app/route/teamManagement", function(e) {
        var path = e.dest.split("/").slice(3).filter((ch) => ch != "");
        switch(path.length) {
        case 0:
            render();
            break;
        case 1:
            if(path[0] == "new") {
                Router.navigate("teamManagement/new", false);
                var control = new Team(getBlankTeam(), true);
                control.setRenderer(ViewManager);
                control.render();
                break;
            } else if(!Number.isInteger(parseInt(path[0]))) {
                Router.navigate("teamManagement");
                break;
            }

            dal.get(`team/${path[0]}`).then(team => {
                delete team.campaigns;
                const control = new Team(team);
                control.setRenderer(ViewManager);
                control.render();
            }).catch(() =>
                Router.navigate("teamManagement"));
            break;
        default:
            Router.navigate("teamManagement");
        }
    });
});
