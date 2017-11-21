define(["jquery", "app/util", "app/spinner", "app/hub", "app/viewManager", "app/dal", "app/list", "app/pageControl", "app/historyGroup",
        "app/dateRange", "moment", "app/noty"],
function($, util, Spinner, hub, ViewManager, dal, List, PageControl, HistoryGroup, DateRange, moment, Noty) {
    var dateRange;

    var responseContainer;

    var markets;

    var noStartDate = MX.strings.get("dateRange_error_emptyStart");
    var noEndDate = MX.strings.get("dateRange_error_emptyEnd");
    var endBeforeStart = MX.strings.get("dateRange_error_endBeforeStart");
    var noData = MX.strings.get("historyViewer_noData");

    var historyGroupConstructor = function(html, group) {
        return new HistoryGroup(html, group, util.noop, markets);
    };

    var render = function() {
        ViewManager.renderView("historyViewer").then(onRender);
    };

    const init = async function() {
        const today = moment();
        const last30Days = moment().subtract(1, "months");

        const momentToDate = original =>
            original.utcOffset(0, true).startOf("day");

        //set the dateRange to reflect this information
        dateRange.setStart(momentToDate(last30Days).toDate());
        dateRange.setEnd(momentToDate(today).toDate());

        $("#search").prop("disabled", true);

        const mpMarkets = await dal.get("market", { mpId: MX.session.creds.user.mp.id });
        markets = mpMarkets;
        $("#search").prop("disabled", false);
    };

    const groupingEq = function(matchA, matchB) {
        if(matchA == null || matchB == null)
            return false;

        var mpId = MX.session.creds.user.mp.id;
        if(!(matchA.sell.mp.id == mpId && matchB.sell.mp.id == mpId) &&
            !(matchA.buy.mp.id == mpId && matchB.buy.mp.id == mpId))
            return false;

        var shardA;
        var shardB;
        var submitA;
        var submitB;

        if(matchA.sell.mp.id == mpId && matchB.sell.mp.id == mpId) {
            shardA = util.getVisibleAttributes(matchA.sell.catRec.shard);
            shardB = util.getVisibleAttributes(matchB.sell.catRec.shard);
            submitA = matchA.sell.submitted;
            submitB = matchB.sell.submitted;
        } else {
            shardA = matchA.buy.selectedAttrs.attributes;
            shardB = matchB.buy.selectedAttrs.attributes;
            submitA = matchA.buy.submitted;
            submitB = matchB.buy.submitted;
        }

        var shardEq = shardA.every((sA) => shardB.some((sB) => sA.id == sB.id)) &&
            shardB.every((sB) => shardA.some((sA) => sA.id == sB.id));

        return shardEq &&
                matchA.matchedAparPrice == matchB.matchedAparPrice &&
                matchA.matchedAsarPrice == matchB.matchedAsarPrice &&
                moment.utc(submitA).startOf("day").isSame(moment.utc(submitB).startOf("day")) &&
                moment.utc(matchA.matchedOn).startOf("day").isSame(moment.utc(matchB.matchedOn).startOf("day")) &&
                moment.utc(matchA.sell.flightDate).startOf("day").isSame(moment.utc(matchB.sell.flightDate).startOf("day"));
    };

    var peek = function(array) {
        if(array.length != 0)
            return array[0];
        return null;
    };

    var groupContinuous = function(data) {
        var results = [];
        while(data.length != 0) {
            var matcher = data.shift();
            var contBlock = [matcher];
            while(groupingEq(peek(data),matcher)) {
                contBlock.push(data.shift());
            }
            results.push(contBlock);
        }
        return results;
    };

    const onSearchClicked = async function() {
        responseContainer.empty();
        Noty.closeAll();
        var errors = dateRange.validate(function(start, end) {
            errors = [];
            if(start == "Invalid date")
                errors.push(noStartDate);
            if(end == "Invalid date")
                errors.push(noEndDate);
            if(moment(end).diff(start, "days") < 0)
                errors.push(endBeforeStart);

            return errors;
        });

        if(errors.length > 0) {
            util.displayErrors(errors);
            return;
        }

        Spinner.add($("#pageNav"));

        const pager = new PageControl({
            source: new PageControl.Backend({
                endpoint: "match",
                method: "get",
                start: dateRange.getStart(),
                end: dateRange.getEnd(),
                byMatchDate: $("input:checked").val() == "matchDate"
            }),
            container: $("#pageNav"),
            postProcessing: groupContinuous,
            list: new List({
                container: $("#results"),
                constructor: historyGroupConstructor
            })
        });

        await pager.render();

        Spinner.remove($("#pageNav"));
        if((await pager.list.getModel()).length == 0)
            $("<div>").addClass("error")
                .text(noData).appendTo($("#responseContainer"));
    };

    const onRender = async function() {
        responseContainer = $("#responseContainer");

        dateRange = new DateRange($("#dateRange"));
        await dateRange.render();

        await init();

        $("#search").click(onSearchClicked);
        return onSearchClicked();
    };

    hub.sub("app/route/historyViewer", render);
});
