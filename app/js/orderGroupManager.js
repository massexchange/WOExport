define(["jquery", "app/dal", "app/util", "app/viewManager", "app/hub", "app/pageControl", "app/list", "app/orderGroupRow", "app/permissionEvaluator", "app/noty"],
function($, dal, util, ViewManager, hub, PageControl, List, OrderGroupRow, permEval, Noty) {
    var orders;
    var currentlySelected = []; //Contains the currently selected order objects
    var response;

    var noOrders = MX.strings.get("ogManager_noOrders");
    var ordersCanceled = MX.strings.get("ogManager_canceled");
    var noneSelected = MX.strings.get("ogManager_noneSelected");

    const render = function() {
        ViewManager.renderView("orderGroupManager").then(onRender);
    };

    const getOrderById = function(id) {
        for(var i = 0; i < orders.length; i++)
            if(orders[i].id == id)
                return orders[i];

        return null;
    };

    const cancelOrder = order =>
        dal.put(`orderGroup/${order.id}/status`, "Cancelled");

    const onRender = function() {
        response = $("#response");

        //so that we can pass it to the pagger so that it can do this every navigation.
        const setCheckProps = async function() {
            orders = await pager.list.getModel();
            $(".listDiv input[type='checkbox']").each((index, checkbox) => {
                const isCheckbox = util.fieldEqTo("id", parseInt(checkbox.id, 10));
                $(checkbox)
                    .prop("checked",
                        currentlySelected.some(isCheckbox))
                    .change(() => {
                        if(checkbox.checked) {
                            if(!currentlySelected.some(isCheckbox))
                                currentlySelected.push(getOrderById(checkbox.id));
                        } else
                            currentlySelected = currentlySelected
                                .filter(util.pred.not(isCheckbox));
                    });
            });
            if(orders.length <= 0) {
                response.append("div").html(noOrders);
                cancelButton.addClass("hidden");
            }
        };

        const pager = new PageControl({
            container: $("#pageNav"),
            source: new PageControl.Backend({
                endpoint: "orderGroup/active",
                method: "get"
            }),
            list: new List({
                container: $("#results"),
                constructor: OrderGroupRow
            }),
            postProcessing: setCheckProps
        });
        pager.render().then(setCheckProps);

        if(permEval.hasPermission(MX.session.creds.user, "ROLE_TEAM_ADMIN")
            || permEval.hasPermission(MX.session.creds.user, "ROLE_BUYER"))
        {
            var cancelButton = $("#cancelSelected");
            cancelButton.removeClass("hidden");

            cancelButton.click(async function() {
                Noty.closeAll();
                if(currentlySelected.length > 0) {
                    //Rerender the pager once the selected orders have all been canceled.
                    await Promise.all(currentlySelected.map(cancelOrder));

                    Noty.success(ordersCanceled);
                    currentlySelected = [];

                    return onRender();
                }

                Noty.alert(noneSelected);
            });
        }
    };

    hub.sub("app/route/orderGroupManager", render);
});
