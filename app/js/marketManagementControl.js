define(["jquery", "app/util", "app/renderer", "app/dal","app/dropdown", "app/viewManager",
    "app/privateMarketsTable", "app/mpsTable", "app/noty"],
function($, util, Renderer, dal, Dropdown, ViewManager, PrivateMarketsTable, MpsTable, Noty) {
    return function(container, markets) {
        var allMps;

        var marketsTable;
        var mpsTable;
        var mpsDropdown;

        var elements = {};
        var currentlySelected = {
            parent: null,
            model: null
        };

        var mpDropdownText = MX.strings.get("mktManageControl_mpDropdownText");
        var nameExists = MX.strings.get("mktManageControl_nameExists");
        var noneSelected = MX.strings.get("mktManageControl_noneSelected");
        var marketSaved = MX.strings.get("mktManageControl_saved");

        var modifiedMarkets = [];
        var deletedMarkets = [];

        const exports = {
            container: container,
            model: markets
        };

        exports.render = function() {
            const renderer = new Renderer(exports.container);
            return renderer.renderView("marketManagementControl")
                .then(onRender);
        };

        const onRender = async function() {
            initElements();
            initMarketsControls();
            renderMMTables();

            const mps = await dal.get("mp");
            allMps = mps;
            initMpsControls();
        };

        const initElements = function() {
            elements.MarketsTableContainer = $("#marketsTable");
            elements.MpsTableContainer = $("#mpsTable");
            elements.MpsColumn = $("#mpsColumn");
            elements.NewMarketContainer = $("#newMarketContainer");
            elements.NewMarketButton = $("#newMarket");
            elements.MarketNameInput = $("#newMarketNameInput");
            elements.AddMarketButton = $("#addNewMarket");
            elements.DeleteMarketButton = $("#deleteMarket");
            elements.MpsDropdownContainer = $("#mpsDropdownContainer");
            elements.AddMpButton = $("#addNewMp");
            elements.SaveButton = $("#saveButton");
            elements.ResponseContainer = $("#response");
        };

        const onMarketRowClick = function(html, rowModel) {
            html.click(function(e) {
                if(currentlySelected.parent != null)
                    if(currentlySelected.model.name != rowModel.name)
                        currentlySelected.parent.removeClass("selectedRow");
                    else
                        return;

                elements.MpsColumn.removeClass("hidden");

                html.parent().addClass("selectedRow");

                currentlySelected.parent = html.parent();
                currentlySelected.model = rowModel;

                renderParticipantsTable(rowModel);
            });
        };

        const renderMMTables = function() {
            elements.MarketsTableContainer.empty();
            marketsTable = new PrivateMarketsTable(elements.MarketsTableContainer, exports.model, onMarketRowClick);
            return marketsTable.render();
        };

        const mpsTableRowFunc = function(html, rowModel) {
            html.find("input").click(() => {
                currentlySelected.model.members = currentlySelected.model.members
                    .filter(mp => mp.id != rowModel.id);

                renderParticipantsTable(currentlySelected.model);
                addToModified(currentlySelected.model);
            });
        };

        const renderParticipantsTable = function(market) {
            elements.MpsTableContainer.empty();
            mpsTable = new MpsTable(elements.MpsTableContainer, market.members, mpsTableRowFunc);
            mpsTable.render();

            renderMpsdropdown();
        };

        const renderMpsdropdown = function() {
            elements.MpsDropdownContainer.empty();

            const filteredMps = allMps.filter(mp =>
                mp.id != MX.session.creds.user.mp.id &&
                !currentlySelected.model.members
                    .some(member => member.id == mp.id));

            if(filteredMps.length > 0) {
                elements.AddMpButton.removeClass("hidden");
                elements.AddMpButton.prop("disabled", true);

                mpsDropdown = new Dropdown(filteredMps, {
                    container: elements.MpsDropdownContainer,
                    promptText: mpDropdownText,
                    textField: "name"
                });

                mpsDropdown.change.subscribe(({ item: mp }) =>
                    elements.AddMpButton.prop("disabled", !mp));

                mpsDropdown.render();
            } else
                elements.AddMpButton.addClass("hidden");
        };

        const safeAdd = (table, item, rowFunc, handler) => {
            if(table.model.length == 0)
                table.render(rowFunc).then(() => table.addItem(item, handler));
            else
                table.addItem(item, handler);
        };

        var initMarketsControls = function() {
            elements.NewMarketButton.click(() =>
                elements.NewMarketContainer.removeClass("hidden"));

            elements.AddMarketButton.click(() => {
                const marketName = elements.MarketNameInput.val();
                elements.MarketNameInput.val("");

                if(!validateName(marketName))
                    Noty.error(nameExists);
                else {
                    const newMarket = {
                        name: marketName,
                        type: "Private",
                        owner: MX.session.creds.user.mp,
                        members: []
                    };
                    addToModified(newMarket);

                    safeAdd(marketsTable.table, newMarket, exports.rowFunc, onMarketRowClick);

                    elements.NewMarketContainer.addClass("hidden");
                }
            });

            elements.DeleteMarketButton.click(() => {
                if(currentlySelected.model == null)
                    Noty.error(noneSelected);
                else {
                    exports.model = exports.model.filter(market =>
                        market.name != currentlySelected.model.name);

                    renderMMTables();

                    addToDeleted(currentlySelected.model);
                    elements.MpsColumn.addClass("hidden");

                    currentlySelected = { container: null, model: null };
                }
            });

            elements.SaveButton.click(async () => {
                //Delete the markets first, then create/modify new/existing ones to prevent name conflicts
                const deletePs = deletedMarkets
                    .filter(market =>
                        market.id != null)
                    .map(market =>
                        dal.delete(`market/${market.id}`));

                await Promise.all(deletePs);

                const savePs = modifiedMarkets.map(market => {
                    market.type = market.type.name || market.type; //Fix because backend can't deserialize enums

                    if(market.id != null)
                        return dal.put(`market/${market.id}`, market);

                    return dal.post("market", market);
                });

                await Promise.all(savePs);

                Noty.success(marketSaved);

                //Reset state
                modifiedMarkets = [];
                deletedMarkets = [];
            });
        };

        const initMpsControls = function() {
            elements.AddMpButton.click(() => {
                const addedMp = mpsDropdown.selected.item;

                safeAdd(mpsTable.table, addedMp, mpsTableRowFunc, mpsTableRowFunc);

                currentlySelected.model.members = mpsTable.table.model;

                addToModified(currentlySelected.model);

                renderMpsdropdown();
            });
        };

        const addToModified = function(modified) {
            modifiedMarkets = modifiedMarkets.filter(market =>
                market.name != modified.name);

            modifiedMarkets.push(modified);
        };

        const addToDeleted = function(deleted) {
            //Edge case: User creates a new market, then removes it before saving
            if(deleted.id == null)
                modifiedMarkets = modifiedMarkets.filter(market =>
                    market.name != deleted.name);

            deletedMarkets = deletedMarkets.filter(market =>
                market.name != deleted.name);

            deletedMarkets.push(deleted);
        };

        const validateName = function(marketName) {
            return !exports.model.some(market =>
                market.name == marketName);
        };

        return exports;
    };
});
