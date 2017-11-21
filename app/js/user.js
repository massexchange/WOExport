define(["app/util", "app/viewManager", "app/session", "app/dropdown", "app/dal", "app/validator",
"app/userProfileTeamsTable", "app/permissionEvaluator", "app/router", "app/noty"],
function(util, ViewManager, Session, Dropdown, dal, Validator, UserProfileTeamsTable, permEval, Router, Noty) {
    return function(user) {

        var exports = {};

        var firstName;
        var lastName;
        var password;
        var passwordConfirm;
        var saveButton;
        var response;

        var userTeamsTable;
        var userRolesDropdown;

        var isPublisher;

        var userSavedMsg = MX.strings.get("user_saved");
        var usernameConflict = MX.strings.get("user_error_usernameConflict");
        var emptyPassword = MX.strings.get("user_error_emptyPass");
        var roleDropdownText = MX.strings.get("user_roleDropdownText");
        var accountAdminMsg = MX.strings.get("user_accountAdminMsg");
        var notTeamMember = MX.strings.get("user_notTeamMember");
        var emptyUsername = MX.strings.get("user_error_emptyUsername");
        var invalidEmail = MX.strings.get("user_error_invalidEmail");
        var passwordMismatch = MX.strings.get("user_error_passwordMismatch");
        var emptyRole = MX.strings.get("user_error_emptyRole");

        const save = async function() {
            response.empty();
            Noty.closeAll();

            const errorMsgs = validate();
            if(errorMsgs.length > 0) {
                util.displayErrors(errorMsgs);
                return;
            }

            const newUserData = getData(MX.session.creds);

            //modifying existing user
            if(newUserData.id)
                await dal.put(`user/${exports.model.id}`, newUserData);
            //new user
            else {
                if(!password.val()) {
                    Noty.error(emptyPassword);
                    return;
                }

                user.status = "Active";

                await dal.post("user/", newUserData);
                Router.navigate("userManagement");
            }

            Noty.success(userSavedMsg);
        };

        const onRender = async function(el) {
            firstName = $("#firstName");
            lastName = $("#lastName");
            saveButton = $("#saveButton");
            response = $("#response");
            password = $("#password");
            passwordConfirm = $("#passwordConfirm");
            exports.model = user;

            isPublisher = user.mp.role == "PUBLISHER";

            if(user.id && MX.session.creds.user.id != user.id)
                $("#statusContainer").removeClass("hidden");

            $("#userForm input").keydown(function(e) {
                if(e.keyCode == 13) save();
            });
            saveButton.click(save);

            if(isPublisher) {
                const requestingUser = MX.session.creds.user;
                const userRole = user.perms.length > 0
                    ? user.perms[0].permission
                    : null;

                if(permEval.isMXAdmin(user))
                    $("#userRole").html("MX Admin");
                else if(permEval.isMPAdmin(user) || !permEval.isMXAdmin(requestingUser) && !permEval.isMPAdmin(requestingUser))
                    $("#userRole").html(userRole.readableName);
                else {
                    const pubRoles = await dal.get("permissions/publisher");
                    userRolesDropdown = new Dropdown(pubRoles, {
                        container: $("#userRole"),
                        promptText: roleDropdownText,
                        textField: "readableName"
                    });
                    await userRolesDropdown.render();
                    if(userRole)
                        userRolesDropdown.selectByVal(userRole.id, false);
                }
            } else {
                if(!user.id || !user.perms)
                    $("#rolesContainer").hide();

                const processedPerms = await processPerms(user.perms);
                if(processedPerms.length > 0) {
                    userTeamsTable = new UserProfileTeamsTable($("#userTeamsTable"), processedPerms, exports.rowFunc);
                    return userTeamsTable.render();
                }

                $("#userTeamsTable").text(
                    permEval.isMPAdmin(user)
                        ? accountAdminMsg
                        : notTeamMember);
            }
        };

        const processPerms = async function(perms) {
            const teamsRoleMap = {};

            const permsWithTeam = perms
                .filter(perm =>
                    perm.teamId != null);

            //Get names of all teams user is in
            await Promise.all(
                permsWithTeam.map(async perm => {
                    const team = await dal.get(`team/${perm.teamId}`);
                    teamsRoleMap[team.id] = {
                        name: team.name,
                        roles: []
                    };
                }));

            //Now collect the list of roles the user has in each team
            permsWithTeam.forEach(perm =>
                teamsRoleMap[perm.teamId].roles.push(
                    perm.permission.readableName));

            return Object.values(teamsRoleMap)
                .map(teamPerms => ({
                    teamName: teamPerms.name,
                    allRoles: teamPerms.roles.join(", ")
                }));
        };

        exports.render = function() {
            return ViewManager.renderTemplate("user", user).then(onRender);
        };

        var getData = exports.getData = function(creds) {
            exports.model.firstName = firstName.val();
            exports.model.lastName = lastName.val();
            exports.model.username = $("#username").val();
            exports.model.email = $("#email").val();
            exports.model.mp = creds.user.mp;
            exports.model.status = $("input:checked").val();

            if(isPublisher && userRolesDropdown != null) {
                const userPerm = exports.model.perms[0] != null
                    ? exports.model.perms[0]
                    : {
                        user: exports.model,
                        permission: null,
                        teamId: null
                    };

                userPerm.permission = userRolesDropdown.selected.item;
                exports.model.perms = [userPerm];
            }

            const passVal = password.val();
            if(passVal)
                //gets hashed on backend
                exports.model.hashedPassword = passVal;

            return exports.model;
        };

        var validate = exports.validate = function() {
            var errorMsgs = [];

            if(!$("#username").val())
                errorMsgs.push(emptyUsername);

            if(!Validator.isEmail($("#email").val()))
                errorMsgs.push(invalidEmail);

            if(password.val() != passwordConfirm.val())
                errorMsgs.push(passwordMismatch);

            if(isPublisher && userRolesDropdown != null)
                if(userRolesDropdown.selected == null)
                    errorMsgs.push(emptyRole);

            return errorMsgs;
        };

        return exports;
    };
});
