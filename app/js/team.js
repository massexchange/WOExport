define(["jquery", "app/util", "app/dal", "app/dropdown", "app/viewManager", "app/teamMembersTable", "app/hub",
    "app/session", "app/renderer", "app/permissionEvaluator", "app/router", "app/noty"],
function($, util, dal, Dropdown, ViewManager, TeamMembersTable, hub, Session, Renderer, permEval, Router, Noty) {
    return function(team, isNew) {
        var exports = {};

        var teamDropdown;
        var teamMembersTable;

        var saveButton;
        var deleteButton;
        var teamName;
        var response;

        var currentTeam;
        var tableContainer;

        var currentUser = MX.session.creds.user;
        var editable = permEval.hasPermission(currentUser, "MP_ADMIN") || permEval.isTeamAdmin(currentUser, team.id);

        var newHeaderTitle = MX.strings.get("team_newHeaderTitle");
        var emptyNameError = MX.strings.get("team_error_emptyName");
        var createdMsg = MX.strings.get("team_created");
        var teamHeaderTitle = MX.strings.get("team_headerTitle");
        var dropdownText = MX.strings.get("team_teamDropdownText");
        var savedMsg = MX.strings.get("team_saved");

        var onRender = exports.onRender = async function() {
            teamName = $("#teamName");
            saveButton = $("#saveButton");
            deleteButton = $("#deleteButton");
            tableContainer = $("#membersTableContainer");
            response = $("#response");

            currentTeam = team;

            if(isNew) {
                $("#headerTitle").html(newHeaderTitle);
                $("#teamManagementContainer").removeClass("hidden");
                saveButton.removeClass("hidden");
                saveButton.click(createTeam);

                teamMembersTable = new TeamMembersTable(tableContainer, team, MX.session.creds, editable);
                await teamMembersTable.init();

                return teamMembersTable.render();
            }

            const teams = await dal.get("team");
            teams.forEach(t =>
                delete t.campaigns); //TODO: find way to not send back unneeded data in backend

            return renderTeamControl(teams);
        };

        const createTeam = async function(team) {
            Noty.closeAll();
            response.html("");
            saveButton.prop("disabled", true);

            var data = teamMembersTable.getData();
            currentTeam.name = teamName.val();
            if(currentTeam.name == "") {
                Noty.error(emptyNameError);
                saveButton.prop("disabled", false);
                return;
            }
            currentTeam.members = data.teamMembers;

            const savedTeam = await dal.post("team", currentTeam);

            saveButton.prop("disabled", false);
            currentTeam = savedTeam;

            const teams = await dal.get("team");

            teams.forEach(t =>
                delete t.campaigns); //TODO: find way to not send back unneeded data in backend

            renderTeamControl(teams, () => {
                teamDropdown.selectByVal(currentTeam.id);
                Noty.success(createdMsg);
            });
            $("#headerTitle").text(teamHeaderTitle);
            Router.navigate(`teamManagement/${savedTeam.id}`, false);
        };

        const renderTeamsDropdown = function(teams) {
            var options = {
                container: $("#teamDropdownContainer"),
                promptText: dropdownText,
                textField: "name",
                valField: "id",
                enableDefault: false
            };

            teamDropdown = new Dropdown(teams, options);

            teamDropdown.change.subscribe(async ({ item }) => {
                response.empty();
                $("#teamManagementContainer").removeClass("hidden");
                $("#selectTeamMsg").addClass("hidden");

                if(editable)
                    deleteButton.removeClass("hidden");
                else
                    deleteButton.addClass("hidden");

                currentTeam = item;
                Router.navigate(`teamManagement/${currentTeam.id}`, false);
                teamName.val(currentTeam.name);

                tableContainer.empty();
                teamMembersTable = new TeamMembersTable(tableContainer, util.cloneSimple(currentTeam), MX.session.creds, editable);

                await teamMembersTable.init();
                teamMembersTable.render();
            });

            return teamDropdown.render();
        };

        const renderTeamControl = async function(teams) {
            if(editable) {
                saveButton.removeClass("hidden");
                saveButton.click(saveTeam);
                deleteButton.click(deleteTeam);
            } else
                teamName.attr("disabled", true);

            await renderTeamsDropdown(teams);
            teamDropdown.selectByVal(currentTeam.id);
        };

        const saveTeam = async function() {
            Noty.closeAll();
            response.html("");
            saveButton.prop("disabled", true);

            var data = teamMembersTable.getData();
            currentTeam.name = teamName.val();
            if(currentTeam.name == "") {
                Noty.error(emptyNameError);
                saveButton.prop("disabled", false);
                return;
            }
            currentTeam.members = data.teamMembers;

            const savedTeam = await dal.put(`team/${currentTeam.id}`, currentTeam);

            delete savedTeam.campaigns; //TODO: find way to not send back unneeded data in backend
            currentTeam = savedTeam;

            Noty.success(savedMsg);
            saveButton.prop("disabled", false);

            const teams = await dal.get("team");

            teams.forEach(t =>
                delete t.campaigns);

            teamDropdown.unrender();
            teamDropdown.items = teams;

            await teamDropdown.render();
            teamDropdown.selectByVal(savedTeam.id, false);
        };

        const deleteTeam = async function() {
            Noty.closeAll();
            response.html("");

            await dal.delete(`team/${currentTeam.id}`, currentTeam);
            Router.navigate("teamManagement");
        };

        exports.setRenderer = function(rend) {
            exports.renderer = rend;
        };

        exports.render = function() {
            exports.renderer.renderTemplate("team").then(onRender);
        };

        return exports;
    };
});
