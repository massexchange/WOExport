define(["app/util"], function(util) {
    var exports = {};

    exports.hasPermission = (user, permName) =>
        user.perms.some(({ permission: { authority } }) =>
            [permName, "ROLE_MX_ADMIN", "ROLE_MP_ADMIN"]
                .includes(authority));

    exports.hasPermissions = (user, permNames) =>
        permNames.some(perm =>
            exports.hasPermission(user, perm));

    exports.isMXAdmin = user =>
        user.perms.some(({ permission: { authority } }) =>
            authority == "ROLE_MX_ADMIN");

    exports.isMPAdmin = user =>
        user.perms.some(({ permission: { authority } }) =>
            authority == "ROLE_MP_ADMIN");

    exports.isTeamAdmin = (user, teamId) =>
        user.perms.some(({ teamId: userTeamId, permission: { authority } }) =>
            userTeamId == teamId && (
                authority == "ROLE_TEAM_ADMIN" ||
                authority == "ROLE_MP_ADMIN"));

    return exports;
});
