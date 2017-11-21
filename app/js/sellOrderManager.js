define(["jquery", "app/dal", "app/util", "app/viewManager", "app/hub", "app/pageControl", "app/list", "app/submittedSellOrderRecord", "app/permissionEvaluator", "app/noty"],
function($, dal, util, ViewManager, hub, PageControl, List, SubmittedSellOrderRecord, permEval, Noty) {
    var orders;
    var pager;
    var currentlySelected = []; //Contains the currently selected order objects
    var response;

    var noOrdersPlaced = MX.strings.get("sellManager_noOrdersPlaced");
    var ordersCanceled = MX.strings.get("sellManager_ordersCanceled");
    var errorCanceling = MX.strings.get("sellManager_error_canceling");
    var noOrdersSelected = MX.strings.get("sellManager_noOrdersSelected");

    var submittedSellOrderRecordConstructor = function(html, order) {
        return new SubmittedSellOrderRecord(html, order);
    };

    var render = function() {
        ViewManager.renderView("sellOrderManager").then(onRender);
    };

    var getOrderById = function(id) {
        for(var i = 0; i < orders.length; i++)
            if(orders[i].id == id)
                return orders[i];

        return null;
    };

    //Drop the unitType because its an Enum which usually needs to be converted, but for updating a sellOrder
    //its not even necessary to be present so this is safer
    var dropUnitType = function(sellOrder) {
        delete sellOrder.catRec.shard.type;
        delete sellOrder.catRec.shard.ceilingType;
        return sellOrder;
    };

    var cancelOrder = function(order) {
        order.status = "Cancelled";
        order = dropUnitType(order);
        return dal.put(("order/sell/" + order.id), order);
    };

    var pagerRenderCallback = async function() {
        orders = await pager.list.getModel();
        $(".listDiv input[type='checkbox']").change(function(el) {
            var chkbox = $(this)[0];
            if(chkbox.checked) {
                if(!currentlySelected.some(obj => obj.id == chkbox.id))
                    currentlySelected.push(getOrderById(chkbox.id));
            } else
                currentlySelected = currentlySelected.filter(function(obj) { return obj.id != chkbox.id; });
        });
        if(orders.length <= 0)
            response.append("div").html(noOrdersPlaced);
    };

    var onRender = async function() {
        response = $("#response");

        pager = new PageControl({
            container: $("#pageNav"),
            list: new List({
                container: $("#results"),
                constructor: submittedSellOrderRecordConstructor
            }),
            source: new PageControl.Backend({
                endpoint: "order/sell/active",
                method: "get"
            }),
            onRenderCallBack: pagerRenderCallback
        });

        await pager.render();
        await pagerRenderCallback();

        if(!permEval.hasPermission(MX.session.creds.user, "ROLE_SALES") || orders.length == 0)
            return;

        $("#cancelSelected")
            .removeClass("hidden").off()
            .click(async () => {
                if(currentlySelected.length > 0)
                    //Rerender the pager once the selected orders have all been canceled.
                    try {
                        await Promise.all(
                            currentlySelected.map(cancelOrder));

                        currentlySelected = [];
                        onRender();
                    } catch(resp) {
                        Noty.error(util.errorMsg(errorCanceling, resp));
                    }
                else
                    response.append("div").html(noOrdersSelected);
            });
    };

    hub.sub("app/route/sellOrderManager", render);
});
