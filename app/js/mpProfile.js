define(["jquery", "app/dal", "app/router", "app/viewManager", "app/hub", "app/util", "app/renderer",
    "app/dropdown", "app/mpAdminsTable", "app/permissionEvaluator", "app/validator", "app/noty"],
function($, dal, Router, ViewManager, hub, util, Renderer, Dropdown, MpAdminsTable, permEval, validator, Noty) {
    var exports = {
        dfpCreds: {},
        model: {}
    };

    var users;
    var usersDropdown;
    var mpAdminsTable;
    var mpAdminTableContainer;
    var newAdmins = [];
    var formerAdmins = [];

    var name;
    var mediaEmail;
    var mediaPhone;
    var techEmail;
    var techPhone;
    var website;
    var profile;

    var dfpNetCode;

    var response;

    var isAdmin;

    var userDropdownText = MX.strings.get("mpProf_userDropdownText");
    var profSaved = MX.strings.get("mpProf_saved");
    var mediaEmailInvalid = MX.strings.get("mpProf_error_mediaEmail");
    var mediaPhoneInvalid = MX.strings.get("mpProf_error_mediaPhone");
    var techEmailInvalid = MX.strings.get("mpProf_error_techEmail");
    var techPhoneInvalid = MX.strings.get("mpProf_error_techPhone");
    var websiteInvalid = MX.strings.get("mpProf_error_website");

    const render = async function(mp, creds) {
        exports.model = mp;
        isAdmin = permEval.isMXAdmin(creds.user) ||
            permEval.isMPAdmin(creds.user) &&
            util.idEq(creds.user.mp, exports.model);

        const el = await ViewManager.renderTemplate("mpProfile", mp);

        name = $("#name");
        mediaEmail = $("#mediaEmail");
        mediaPhone = $("#mediaPhone");
        techEmail = $("#techEmail");
        techPhone = $("#techPhone");
        website = $("#website");
        profile = $("#profile");
        response = $("#response");

        dfpNetCode = $("#networkCode");

        //Check user permissions
        if(isAdmin) {
            initMpEditBoxes();
            initDfpBoxes();
            $("#addMpAdmin").removeClass("hidden");
            $("#addMpAdmin").click(function() {
                $("#usersDropdown").removeClass("hidden");
                $("#addMpAdmin").addClass("hidden");
            });

            $("#saveButton").click(save);
            $("#manageDfp").removeClass("hidden");
        } else
            $("#saveButton").hide();

        const mpUsers = await dal.get("user", { mpId: exports.model.id });
        users = mpUsers;
        mpAdminTableContainer = $("#mpAdminTableContainer");

        const currentAdmins = await dal.get(`mp/${exports.model.id}/admins`);
        renderUsersDropdown(currentAdmins);

        mpAdminTableContainer.empty();
        mpAdminsTable = new MpAdminsTable(currentAdmins, mpAdminTableContainer, tableRowFunc);
        return mpAdminsTable.render();
    };

    //Button click listener
    const tableRowFunc = function(html, rowModel) {
        const button = html.find("input");

        if(isAdmin && MX.session.creds.user.id != rowModel.id) {
            html.click(function() {
                Router.navigate(`userProfile/${rowModel.id}`, true);
            });
            button.click(util.partialLeft(removeAdmin, rowModel));
            button.removeClass("hidden");
        } else
            button.hide();
    };

    const addAdmin = function(member) {
        const notMember = util.pred.not(util.idEqTo(member));

        newAdmins = newAdmins.filter(notMember);
        formerAdmins = formerAdmins.filter(notMember);
        newAdmins.push(member);

        mpAdminsTable.model.push(member);
    };

    const removeAdmin = function(member) {
        const notMember = util.pred.not(util.idEqTo(member));

        mpAdminsTable.model = mpAdminsTable.model.filter(notMember);

        formerAdmins = formerAdmins.filter(notMember);
        newAdmins = newAdmins.filter(notMember);
        formerAdmins.push(member);

        mpAdminTableContainer.empty();
        mpAdminsTable = new MpAdminsTable(mpAdminsTable.model, mpAdminTableContainer, tableRowFunc);
        mpAdminsTable.render();

        renderUsersDropdown(mpAdminsTable.model);
    };

    const renderUsersDropdown = function(admins) {
        const nonAdmins = users.filter(user =>
            !admins.some(admin => util.idEq(user, admin)) &&
            user.status != "Inactive" &&
            !permEval.isMXAdmin(user));

        usersDropdown = new Dropdown(nonAdmins, {
            container: $("#usersDropdown"),
            promptText: userDropdownText,
            textField: "username"
        });

        usersDropdown.change.subscribe(({ item: newAdmin }) => {
            addAdmin(newAdmin);
            mpAdminTableContainer.empty();
            mpAdminsTable.render();

            renderUsersDropdown(mpAdminsTable.model);
            $("#usersDropdown").addClass("hidden");
            $("#addMpAdmin").removeClass("hidden");
        });
        return usersDropdown.render();
    };

    const initMpEditBoxes = function() {
        name.prop("disabled", false);
        mediaEmail.prop("disabled", false);
        mediaPhone.prop("disabled", false);
        techEmail.prop("disabled", false);
        techPhone.prop("disabled", false);
        website.prop("disabled", false);
        profile.prop("disabled", false);
        response.prop("disabled", false);
    };

    const initDfpBoxes = async function() {
        dfpNetCode.prop("disabled", false);

        exports.dfpCreds = await dal.get(`mp/${exports.model.id}/dfp`);
        dfpNetCode.val(exports.dfpCreds.networkCode);
    };

    const save = function() {
        Noty.closeAll();
        response.empty();
        const data = getData();
        const errorMsgs = validate(data);
        if(errorMsgs.length > 0) {
            util.displayErrors(errorMsgs);
            return;
        }

        const mpData = data.model;
        dal.put(`mp/${mpData.id}`, mpData)
            .then(savedMp =>
                Noty.success(profSaved));

        if(data.dfpCreds.token != "" && data.dfpCreds.networkCode != "")
            dal.post(`mp/${mpData.id}/dfp`, data.dfpCreds);

        newAdmins.forEach(user =>
            dal.post(`mp/${mpData.id}/admins`, user));

        formerAdmins.forEach(user =>
            dal.delete(`mp/${mpData.id}/admins/${user.id}`));

        newAdmins = [];
        formerAdmins = [];
    };

    const getData = exports.getData = function() {
        exports.model.name = name.val();
        exports.model.mediaEmail = mediaEmail.val();
        exports.model.mediaPhone = mediaPhone.val();
        exports.model.techEmail = techEmail.val();
        exports.model.techPhone = techPhone.val();
        exports.model.website = website.val();
        exports.model.profile = profile.val();

        exports.dfpCreds.networkCode = dfpNetCode.val();

        return exports;
    };

    const validate = exports.validate = function(data) {
        var errorMsgs = [];

        var mEmail = data.model.mediaEmail;
        var mPhone = data.model.mediaPhone;
        var tEmail = data.model.techEmail;
        var tPhone = data.model.techPhone;
        var site = data.model.website;

        if(mEmail == "" || !validator.isEmail(mEmail))
            errorMsgs.push(mediaEmailInvalid);
        if(mPhone == "" || !validator.isPhone(mPhone))
            errorMsgs.push(mediaPhoneInvalid);

        if(tEmail == "" || !validator.isEmail(tEmail))
            errorMsgs.push(techEmailInvalid);
        if(tPhone == "" || !validator.isPhone(tPhone))
            errorMsgs.push(techPhoneInvalid);

        if(site == "" || !validator.isURL(site))
            errorMsgs.push(websiteInvalid);

        return errorMsgs;
    };

    hub.sub("app/route/mpProfile", function(e) {
        const path = e.dest.split("/").slice(3);
        switch(path.length) {
        case 0:
            dal.get(`mp/${MX.session.creds.user.mp.id}`).then(mp =>
                render(mp, MX.session.creds));

            break;
        case 1:
            dal.get(`mp/${path[0]}`).then(mp =>
                render(mp, MX.session.creds));

            break;
        }
    });
});
