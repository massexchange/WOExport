define(["jquery", "app/util", "app/renderer", "app/dropdown", "app/pageControl", "app/list", "app/portfolioOrderGroupRow", "app/session",
    "app/viewManager", "app/hub", "app/repo/campaign", "app/dal"],
function($, util, Renderer, Dropdown, PageControl, List, PortfolioOrderGroupRow, Session, ViewManager, hub, CampaignRepo, dal) {
    var campDropdown;

    var noOrders = MX.strings.get("portfolio_noOrders");
    var campDropdownText = MX.strings.get("portfolio_campDropdownText");

    var orderGroupRowConstructor = function(html, order) {
        return new PortfolioOrderGroupRow(html, order);
    };

    var render = function() {
        ViewManager.renderView("portfolio").then(onRender);
    };

    const handleCampaign = campaign => {
        // Flatten the array of SBs out into an array of orders
        const orders = campaign.orderGroups
            .filter(order =>
                order.status == "Matched");

        if(orders.length > 0)
            renderOrdersTable(orders);
        else {
            $("#results").empty();
            $("#results").append($("<div>").addClass("error").text(noOrders));
        }
    };

    const onRender = async function() {
        const camps = await CampaignRepo.get();
        await renderCampaignsDropdown(camps);

        campDropdown.change.subscribe(({ item }) =>
            handleCampaign(item));

        handleCampaign({
            orderGroups: util.flatten(camps.map(camp =>
                camp.orderGroups))
        });
    };

    const renderOrdersTable = function(orders) {
        const pager = new PageControl({
            container: $("#pageNav"),
            source: new PageControl.Frontend({
                pageSize: 20,
                items: orders
            }),
            list: new List({
                container: $("#results"),
                constructor: orderGroupRowConstructor
            })
        });

        return pager.render();
    };

    const renderCampaignsDropdown = function(camps) {
        campDropdown = new Dropdown(camps, {
            container: $("#campDropdown"),
            promptText: campDropdownText,
            textField: "name",
            enableDefault: true
        });

        return campDropdown.render();
    };

    hub.sub("app/route/portfolio", render);
});
