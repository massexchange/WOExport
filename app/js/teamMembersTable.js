define(["app/util", "app/renderer","app/dal", "app/dropdown", "app/permissionEvaluator", "app/table"],
function(util, Renderer, dal, Dropdown, permEval, Table) {
    return function(container, team, creds, editable) {

        var exports = {
            model: {
                teamMembers: team.members
            },
            container: container,
            creds: creds
        };

        var roleDropdownText = MX.strings.get("teamMembersTable_roleDropdownText");
        var noAvailableUsersMsg = MX.strings.get("teamMembersTable_noUsers");

        const computePermPath = creds =>
            "permissions/advertiser/";

        const addUserToTeam = function(user) {
            exports.model.teamMembers.push(user);
        };

        const removeUserFromTeam = user => {
            user.perms = user.perms.filter(perm =>
                perm.teamId != team.id);

            exports.model.teamMembers = exports.model.teamMembers
                .filter(mem => user.id != mem.id);
        };

        const isAlreadyMember = function(user, memberList) {
            return memberList.some(util.idEqTo(user));
        };

        const renderRolesDropdown = async function(dropdownContainer, user, disabled) {
            const rolesDropdown = new Dropdown(exports.roles, {
                container: dropdownContainer,
                promptText: roleDropdownText,
                textField: "readableName",
                disableDropdown: disabled
            });

            await rolesDropdown.render();

            //Select the current role by default
            // If a current role isn't found then it means either:
            // 1) a mp admin is making a new team so select "Team Administrator"
            // 2) a team admin is adding a new user to team so select "Team Administrator" as default
            const filteredPerms = user.perms.filter(userPerm =>
                (userPerm.teamId && team.id) &&
                (userPerm.teamId == team.id));

            if(filteredPerms.length > 0)
                rolesDropdown.selectByVal(filteredPerms[0].permission.id, false);
            else {
                rolesDropdown.selectByVal(3);

                //By default, add the Team Administrator role
                user.perms.push({
                    permission: rolesDropdown.selected.item,
                    teamId: team.id
                });
            }

            rolesDropdown.change.subscribe(({ val }) => {
                //Remove the old permission
                user.perms = user.perms.filter(obj =>
                    obj.teamId != team.id);

                //Add the new one
                user.perms.push({
                    permission: rolesDropdown.getItemByVal(val),
                    teamId: team.id
                });
            });
        };

        const renderDropdown = function(selectedUser, rolesDropdownContainer) {
            var disableDropdown = false;
            if(selectedUser.id == creds.user.id || (team.id && !editable))
                disableDropdown = true;

            renderRolesDropdown(rolesDropdownContainer, selectedUser, disableDropdown);
            rolesDropdownContainer.show();
        };

        const tableRowFunc = function(html, rowModel) {
            //This function is the change handler for the checkbox in each row.
            //Upon change, a dropdown menu must either render or unrender in the
            //'roles' column.

            //get the checkbox
            var checkbox = html.find("input");

            //the role <td> is the third element of the array
            var rolesDropdownContainer = html.children().eq(2);

            //container for the selected user outside of the checkbox change function
            //i.e. on register
            var rowUserId = parseInt(html.children().eq(1).prop("id"));
            var selectedUser = util.whereEq(exports.users, "id", rowUserId)[0];

            //determine if the checkbox should already be checked after registering the handler
            if(isAlreadyMember(selectedUser, exports.model.teamMembers)) {
                //deal with the user object from list of team members instead of the users list (this discrepency caused a lot of problems!)
                selectedUser = exports.model.teamMembers.find(member =>
                    member.id == rowUserId);

                checkbox.prop("checked", true);
                renderDropdown(selectedUser, rolesDropdownContainer);
            } else
                selectedUser = util.whereEq(exports.users, "id", rowUserId)[0];

            if(!editable) {
                checkbox.attr("disabled", true);
                return;
            }

            //when the checkbox is clicked
            checkbox.change(function() {
                if(this.checked) {
                    renderDropdown(selectedUser, rolesDropdownContainer);
                    addUserToTeam(selectedUser);
                } else {
                    removeUserFromTeam(selectedUser);
                    rolesDropdownContainer.hide();
                }
            });
        };

        //table.js expects the model to be an array
        var columns = [
            {
                "name": "Name",
                "accessor": function(teamMember) {
                    return teamMember.username;
                },
                "type": "string"
            },
            {
                "name": "Team Members",
                "accessor": function(teamMember) {
                    //We pipe the teamMember here on purpose.
                    //The dust file will be checking the id field of what it receives;
                    //if we send the id field in this function, id.id is undefined and
                    //results in an error.
                    return teamMember;
                },
                "type": "checkbox"
            },
            {
                "name": "Role",
                "accessor": function(teamMember) {
                    return " ";
                    //this is a place holder for a dropdown to render into
                    //also now that the row can ignore null data: "" is considered null so it needs to be " "
                    //else row will just drop this column
                },
                "type": "string"
            }
        ];

        exports.init = async function() {
            //get the available roles in order to build the role dropdowns
            const permPath = computePermPath(exports.creds);
            const permP = dal.get(permPath, {});
            const userP = dal.get("user");

            const [roles, users] = await Promise.all([permP, userP]);

            //Filter out inactive users and admin roles
            exports.users = users.filter(obj =>
                obj.status == "Active" &&
                !permEval.isMXAdmin(obj) &&
                !permEval.isMPAdmin(obj));

            exports.roles = roles.filter(obj =>
                ![1, 2].includes(obj.id));

            exports.table = new Table(exports.container, exports.users, columns);
        };

        exports.render = function() {
            if(exports.users.length > 0)
                return exports.table.render(tableRowFunc);

            exports.container.empty().html(
                $("<div>").addClass("error").html(
                    noAvailableUsersMsg));
        };

        exports.getData = function() {
            return exports.model;
        };

        return exports;
    };
});
