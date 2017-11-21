define(["app/util", "app/renderer", "app/session", "app/dropdown", "app/dal", "app/validator", "app/mpProfile", "app/router", "app/noty"],
function(util, Renderer, Session, Dropdown, dal, validator, MpProfile, Router, Noty) {
    return function(mp) {

        var exports = {};
        exports.model = mp;
        var setRenderer = exports.setRenderer = function(rend) {
            exports.renderer = rend;
        };

        var name;
        var mediaEmail;
        var mediaPhone;
        var techEmail;
        var techPhone;
        var website;
        var profile;

        var newAdmins = [];
        var formerAdmins = [];

        var saveButton;

        var mpSaved = MX.strings.get("mp_saved");

        exports.render = async function() {
            const el = await exports.renderer.renderTemplate("mp", exports.model);

            name = $("#name");
            mediaEmail = $("#mediaEmail");
            mediaPhone = $("#mediaPhone");
            techEmail = $("#techEmail");
            techPhone = $("#techPhone");
            website = $("#website");
            profile = $("#profile");

            saveButton = $("#save");

            saveButton.click(async function() {
                var errorMsgs = validate();
                if(errorMsgs.length > 0)
                    util.displayErrors(errorMsgs);

                var newMpData = getData();
                //modifying existing mp
                if(newMpData.id) {
                    dal.put(`mp/${exports.model.id}`, newMpData)
                        .then(savedMp =>
                            Noty.success(mpSaved, null, false));

                    newAdmins.map(async user => {
                        await dal.post(`mp/${newMpData.id}/admins`, user);
                        Noty.success(mpSaved, null, false);
                    });

                    formerAdmins.map(async user => {
                        await dal.delete(`mp/${newMpData.id}/admins/${user.id}`);
                        Noty.success(mpSaved, null, false);
                    });

                    newAdmins = [];
                    formerAdmins = [];
                } else {//new mp
                    const savedMp = await dal.post("mp/", newMpData);

                    Noty.success(mpSaved);
                    Router.navigate(`mpProfile/${savedMp.id}`, true);
                }
            });
        };

        var getData = exports.getData = function() {
            exports.model.name = name.val();
            exports.model.mediaEmail = mediaEmail.val();
            exports.model.mediaPhone = mediaPhone.val();
            exports.model.techEmail = techEmail.val();
            exports.model.techPhone = techPhone.val();
            exports.model.website = website.val();
            exports.model.role = $("#mpRoleContainer input[name=role]:checked").val();
            exports.model.profile = profile.val();

            return exports.model;
        };

        var validate = exports.validate = function() {
            var errorMsgs = [];

            var mEmail = mediaEmail.val();
            var mPhone = mediaPhone.val();
            var tEmail = techEmail.val();
            var tPhone = techPhone.val();
            var site = website.val();

            if(mEmail != "" && !validator.isEmail(mEmail))
                errorMsgs.push("Media email is invalid");
            if(mPhone != "" && !validator.isPhone(mPhone))
                errorMsgs.push("Media phone is invalid");
            if(tEmail != "" && !validator.isEmail(tEmail))
                errorMsgs.push("Tech email is invalid");
            if(tPhone != "" && !validator.isPhone(tPhone))
                errorMsgs.push("Tech phone is invalid");
            if(site != "" && !validator.isURL(site))
                errorMsgs.push("Website url is invalid");

            return errorMsgs;
        };

        return exports;
    };
});
