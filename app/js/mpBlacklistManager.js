define(["jquery", "app/util", "app/viewManager", "app/session", "app/dal", "app/hub", "app/dropdown", "app/blacklist", "app/permissionEvaluator", "app/noty"],
function($, util, ViewManager, Session, dal, hub, Dropdown, Blacklist, permEval, Noty) {
    var oppositeRole = (MX.session.creds.user.mp.role == "ADVERTISER") ? "PUBLISHER" : "ADVERTISER";


    var blacklistP;
    var mpP;

    var blacklist = {lister:MX.session.creds.user.mp , listees:[]};
    var mps;
    var blacklistTable;
    var selectedMp;
    var mpDropdown;
    var msg;
    var blacklistContainer;
    var counterpartyContainer; // contains the mpDropdown

    var blacklistEmpty = MX.strings.get("mpBlacklistManager_empty");
    var mpDropdownText = MX.strings.get("mpBlacklistManager_mpDropdownText");
    var blacklistSaved = MX.strings.get("mpBlacklistManager_saved");

    var blacklistEndpoint = `mp/${MX.session.creds.user.mp.id}/blacklist`;

    var render = function() {
        blacklistP = dal.get(blacklistEndpoint);
        mpP = dal.get("mp", { role: oppositeRole });

        ViewManager.renderView("mpBlacklistManager").then(onRender);
    };

    var onRender = function() {
        msg = $("#msg");
        blacklistContainer = $("#blacklistContainer");
        counterpartyContainer = $("#counterpartiesDiv");
        var renderMPDropdown = function() {
            //first, filter MPs that are already blacklisted
            if(blacklist.listees.length > 0)
                mps = mps.filter(current =>
                    blacklist.listees.every(alreadyListed =>
                        current.id != alreadyListed.id));

            if(permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD")) {
                $("#saveButton").removeClass("hidden");

                if(mps.length > 0)
                    counterpartyContainer.removeClass("hidden");
            }

            if(blacklist.listees.length == 0)
                $("#msg").html(blacklistEmpty);

            mpDropdown = new Dropdown(mps, {
                container: $("#mpDropdown"),
                promptText: mpDropdownText,
                textField: "name"
            });

            mpDropdown.change.subscribe(({ item: mp }) => {
                selectedMp = mp;
                $("#addMP").prop("disabled", !mp);
            });

            return mpDropdown.render();
        };

        const hideEmptyCounterpartyContainer = function() {
            if(mpDropdown.model.length == 0)
                counterpartyContainer.addClass("hidden");
        };

        const removeButtonCallback = function(container, member) {
            const removeButton = $(container).find("input[type=button][value=Remove]");
            removeButton.click(function() {
                msg.empty();

                //first, get the thingy back in the dropdown
                mpDropdown.addItem(member);

                //if the div is hidden, unhide it!
                if (counterpartyContainer.hasClass("hidden"))
                    counterpartyContainer.removeClass("hidden");

                //then get the new thingy out of the row.
                removeButton.parent().parent().remove();

                blacklistTable.table.model = blacklistTable.table.model
                    .filter(obj =>
                        obj.id != member.id);

                if(blacklistTable.table.model.length == 0)
                    blacklistContainer.addClass("hidden");
            });

            if(permEval.hasPermission(MX.session.creds.user, "ROLE_MP_ADMIN") ||
                permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD"))
                removeButton.removeClass("hidden");

            hideEmptyCounterpartyContainer();
        };

        const renderBlacklist = function() {
            blacklistTable = new Blacklist($("#blacklistDiv"), blacklist, removeButtonCallback);
            blacklistTable.render();
            if(blacklist.listees.length > 0)
                blacklistContainer.removeClass("hidden");
        };

        const saveBlacklist = async function() {
            msg.empty();
            const newlistees = blacklistTable.table.model;

            await dal.put(blacklistEndpoint, newlistees);
            Noty.success(blacklistSaved);
        };

        Promise.all([blacklistP, mpP]).then(async function([listees, mpReturn]) {
            blacklist.listees = listees;
            mps = mpReturn;

            await renderMPDropdown();
            renderBlacklist();
        });

        $("#saveButton").click(saveBlacklist);

        $("#addMP").click(function() {
            msg.empty();

            blacklistTable.addMember(selectedMp);
            mpDropdown.removeByVal(selectedMp.id);
            blacklistContainer.removeClass("hidden");

            hideEmptyCounterpartyContainer();
        });
    };

    hub.sub("app/route/mpBlacklistManager", render);
});
