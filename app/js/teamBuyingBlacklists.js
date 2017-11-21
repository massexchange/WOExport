define(["jquery", "app/util", "app/dal", "app/repo/attr", "app/dropdown", "app/viewManager", "app/hub", "app/session", "app/renderer",
    "app/repo/attrType", "app/attributeSelector", "app/blacklistInstrument", "app/noty"],
function($, util, dal, AttrRepo, Dropdown, ViewManager, hub, Session, Renderer, AttrTypeRepo,
    AttributeSelector, BlacklistInstrument, Noty) {

    var teamDropdown;
    var aparAttributeSelector;
    var asarAttributeSelector;
    var blacklistTable = [];

    var elements = {};

    var currentTeam;

    var bannedTypes = []; //just incase there are attributes we don't want to be able to be blackInst'ed

    var entryConflict = MX.strings.get("teamBuyingBl_entryConflict");
    var emptyEntry = MX.strings.get("teamBuyingBl_emptyEntry");
    var teamDropdownText = MX.strings.get("teamBuyingBl_teamDropdownText");
    var savedMsg = MX.strings.get("teamBuyingBl_saved");
    var saveError = MX.strings.get("teamBuyingBl_error_save");

    var attrsEq = function(attrs1, attrs2) {
        if(attrs1.length != attrs2.length)
            return false;
        return attrs1.reduce(
            (sum, curr) => sum && attrs2.some((attr) => attr.value == curr.value),
            true
        );
    };

    var rowOnDelete = function(inst, el) {
        //remove it from the table
        blacklistTable = blacklistTable.filter((i) =>
            !attrsEq(i.model.attributes,inst.attributes)
        );

        //delete the row
        el.remove();
    };

    var createRow = function(inst) {
        if(blacklistTable.some((i) => attrsEq(i.model.attributes,inst.attributes)))
            Noty.error(entryConflict);
        else if(inst.attributes.length == 0)
            Noty.error(emptyEntry);
        else{
            var newRow = new BlacklistInstrument( $("<div>").addClass("blacklistRow").appendTo(elements.blacklistTableBody), inst, rowOnDelete);
            blacklistTable.push(newRow);
            newRow.render();
        }
    };

    var onRender = async function() {
        elements.aparAttributeSelectorBody = $("#aparAttributeSelector");
        elements.asarAttributeSelectorBody = $("#asarAttributeSelector");
        elements.controlsBody = $("#blackListControls");
        elements.createButton = $("#createButton");
        elements.blacklistTableBody = $("#blacklistTable");
        elements.saveButton = $("#saveButton");
        elements.response = $("#response");

        const teamP = dal.get("team", { mpId: MX.session.creds.user.mp.id });
        const attrP = AttrRepo.get();

        elements.saveButton.click(async function() {
            Noty.closeAll();
            currentTeam.blacklistInstruments = blacklistTable.map(bI => bI.model);

            try {
                await dal.put(`team/${currentTeam.id}`, currentTeam);
                Noty.success(savedMsg);
            } catch(resp) {
                Noty.error(util.errorMsg(saveError, resp));
            }
        });

        await Promise.all([
            attrP.then(initAttrSelectors),
            teamP.then(initTeamDropdown)]);

        elements.controlsBody.removeClass("hidden");
        elements.createButton.click(() => {
            Noty.closeAll();
            createRow({
                attributes: [
                    ...aparAttributeSelector.getData(),
                    ...asarAttributeSelector.getData()],
                id: null
            });
        });
    };

    const initAttrSelectors = attrs => {
        const allowedAttrs = attrs.filter((attr) =>
            !bannedTypes.some((bT) => bT == attr.type.name)
        );
        aparAttributeSelector = new AttributeSelector([],
            elements.aparAttributeSelectorBody,
            allowedAttrs.filter(attr => attr.type.component.name == "Placement"),
            {}
        );
        asarAttributeSelector = new AttributeSelector([],
            elements.asarAttributeSelectorBody,
            allowedAttrs.filter(attr => attr.type.component.name != "Placement"),
            {}
        );

        return Promise.all([
            aparAttributeSelector.render(),
            asarAttributeSelector.render()
        ]);
    };

    const initTeamDropdown = teams => {
        teamDropdown = new Dropdown(teams, {
            container: $("#teamDropdownContainer"),
            promptText: teamDropdownText,
            textField: "name"
        });

        teamDropdown.change.subscribe(({ item: team }) => {
            elements.saveButton.removeClass("hidden");
            elements.response.empty();
            currentTeam = team;

            elements.aparAttributeSelectorBody.removeClass("hidden");
            elements.asarAttributeSelectorBody.removeClass("hidden");
            elements.createButton.removeClass("hidden");

            elements.blacklistTableBody.empty();
            blacklistTable = [];
            currentTeam.blacklistInstruments.forEach(createRow);
        });

        return teamDropdown.render();
    };

    var render = function() {
        ViewManager.renderView("teamBuyingBlacklists").then(onRender);
    };

    hub.sub("app/route/teamBuyingBlacklists", render);
});
