define(["jquery", "moment", "app/dal", "app/util", "app/viewManager", "app/hub", "app/attributeSelector",
    "app/repo/attrCache", "app/attributeSlider", "app/flightSlider", "app/attributeHider"],
function($, moment, dal, util, ViewManager, hub, AttributeSelector, AttrCacheRepo, AttributeSlider
    , FlightSlider, AttributeHider) {


    var elements = {};
    var objects = {};
    var strings = {};
    strings.noSliders = MX.strings.get("pricingSimulator_noSliders");
    strings.noPricing = MX.strings.get("pricingSimulator_noPricing");
    strings.noRateCard = MX.strings.get("pricingSimulator_noRateCard");
    strings.noGraph = MX.strings.get("pricingSimulator_noGraph");
    strings.errors = {};
    strings.errors.future = MX.strings.get("pricingSimulator_error_future");
    strings.errors.invalidDate = MX.strings.get("pricingSimulator_error_invalidDate");
    strings.functions = {};
    strings.functions.rateCardPrice = MX.strings.get("pricingSimulator_function_rateCardPrice");
    strings.functions.rateCardKey = MX.strings.get("pricingSimulator_function_rateCardKey");
    strings.functions.unitTypeName = MX.strings.get("pricingSimulator_function_unitTypeName");
    strings.functions.adSizeName = MX.strings.get("pricingSimulator_function_adSizeName");
    strings.functions.daysToFlight = MX.strings.get("pricingSimulator_function_daysToFlight");
    strings.functions.pagPrice = MX.strings.get("pricingSimulator_function_pagPrice");
    strings.functions.fixedPriceResult = MX.strings.get("pricingSimulator_function_fixedPriceResult");
    strings.functions.variablePriceResult = MX.strings.get("pricingSimulator_function_variablePriceResult");

    var emptyData = () => {
        elements.variablePriceResult.addClass("hidden");
        elements.variablePriceResult.text("");
        elements.rateCardKey.addClass("hidden");
        elements.rateCardKey.text("");
        elements.unitTypeName.addClass("hidden");
        elements.unitTypeName.text("");
        elements.adSizeName.addClass("hidden");
        elements.adSizeName.text("");
        elements.pagPrice.addClass("hidden");
        elements.pagPrice.text("");
        elements.attrAPARSliderTable.empty();
        elements.attrAPARSliderTable.text(strings.noSliders);
        elements.attrASARSliderTable.empty();
        elements.attrASARSliderTable.text(strings.noSliders);
        elements.flightSliderTable.empty();
        elements.flightSliderTable.text(strings.noSliders);
        elements.fixedPriceResult.text(strings.noPricing);
        elements.rateCardPrice.text(strings.noRateCard);
        //elements.daysToFlight.text(strings.noGraph);
    };

    var validate = (proxyCatalogRecord) => {
        var errors = [];

        if(moment.utc(proxyCatalogRecord.inventory.flightDate).isBefore(moment.utc()))
            errors.push(strings.errors.future);

        if(!moment.utc(proxyCatalogRecord.inventory.flightDate).isValid())
            errors.push(strings.errors.invalidDate);

        return errors;
    };

    const viewButtonClickHandler = async () => {
        elements.response.empty();
        emptyData();

        const targetAttrs = [
            ...objects.aparSelector.getData(),
            ...objects.asarSelector.getData()];

        const proxyInstrument = {
            attributes: targetAttrs
        };
        const hiddenIds = objects.hiders
            .map(hider => hider.getData())
            .filter(attrHider => attrHider.hidden)
            .map(attrHider=> attrHider.attribute.id);

        const proxyShard = {
            inst: proxyInstrument,
            hiddenAttrIds: hiddenIds
        };
        const selectedDate = moment.utc(elements.date.val()).format(MX.dateTransportFormat);
        const proxyInventory = {
            flightDate: selectedDate
        };
        const proxyCatalogRecord = {
            shard: proxyShard,
            inventory: proxyInventory
        };

        const errors = validate(proxyCatalogRecord);
        if(errors.length) {
            elements.response.append(errors.map(msg =>
                $("<div>").html(msg)));

            return;
        }

        const resp = await dal.post("pricing", proxyCatalogRecord);

        if(util.isNull(resp.keyAttribute))
            return;

        elements.rateCardPrice.text(strings.functions.rateCardPrice(resp));
        elements.rateCardKey.text(strings.functions.rateCardKey(resp));
        elements.unitTypeName.text(strings.functions.unitTypeName(resp));
        elements.adSizeName.text(strings.functions.adSizeName(resp));

        elements.rateCardPrice.removeClass("hidden");
        elements.rateCardKey.removeClass("hidden");
        elements.unitTypeName.removeClass("hidden");
        elements.adSizeName.removeClass("hidden");

        //as Per FE-992 we don't want to act on variable stuff rn as that isn't being supported
        //but we don't want to delete it either for the day it becomes supported again
        // if(!util.isNull(resp.graphAPARPrice)) {
        //     elements.daysToFlight.text(strings.functions.daysToFlight(resp));
        //     elements.pagPrice.text(strings.functions.pagPrice(resp));
        //     elements.pagPrice.removeClass("hidden");
        // }

        const makeSliderTable = (sliders, div, constructor) => {
            if(sliders.length != 0) {
                div.empty();
                sliders
                    .map(slider =>
                        new constructor($("<div>").appendTo(div), slider, false))
                    .forEach(control =>
                        control.render());
            }
        };

        makeSliderTable(resp.aparSliders, elements.attrAPARSliderTable, AttributeSlider);
        makeSliderTable(resp.asarSliders, elements.attrASARSliderTable, AttributeSlider);
        makeSliderTable(resp.flightSliders, elements.flightSliderTable, FlightSlider);

        elements.fixedPriceResult.text(strings.functions.fixedPriceResult(resp));

        // if(!util.isNull(resp.graphAPARPrice)) {
        //     elements.variablePriceResult.text(strings.functions.variablePriceResult(resp));
        //     elements.variablePriceResult.removeClass("hidden");
        // }
    };

    var selectorOnChange = () => {
        elements.hiddenSelector.empty();
        var targetAttrs = objects.aparSelector.getData().concat(objects.asarSelector.getData());

        objects.hiders = targetAttrs
            .map(attr => new AttributeHider($("<div>").addClass("attrHider").appendTo(elements.hiddenSelector), attr));

        objects.hiders.forEach(hider => hider.render());
    };

    var render = async () => {
        var page = ViewManager.renderView("pricingSimulator");
        var attrP = AttrCacheRepo.get();

        const [, attrCaches] = await Promise.all([page, attrP]);

        elements.aparSelector = $("#aparSelector");
        elements.asarSelector = $("#asarSelector");
        elements.hiddenSelector = $("#hiddenSelector");
        elements.date = $("#date");
        elements.viewButton = $("#viewButton");

        elements.response = $("#response");
        elements.fixedPriceResult = $("#fixedPriceResult");
        elements.variablePriceResult = $("#variablePriceResult");
        elements.rateCardPrice = $("#rateCardPrice");
        elements.rateCardKey = $("#rateCardKey");
        elements.unitTypeName = $("#unitTypeName");
        elements.adSizeName = $("#adSizeName");
        elements.daysToFlight = $("#daysToFlight");
        elements.pagPrice = $("#pagPrice");
        elements.attrAPARSliderTable = $("#attrAPARSliderTable");
        elements.attrASARSliderTable = $("#attrASARSliderTable");
        elements.flightSliderTable = $("#flightSliderTable");

        emptyData();

        const makeSelector = (div, type) => new AttributeSelector([], div,
            util.flatten(attrCaches
                .filter(util.pred.attrIsInCategory(type))
                .map(cache => cache.attributes)),
            { onChange: selectorOnChange });

        objects.aparSelector = makeSelector(elements.aparSelector, "Placement");
        objects.asarSelector = makeSelector(elements.asarSelector, "Audience");

        objects.hiders = [];

        await Promise.all([
            objects.aparSelector.render(),
            objects.asarSelector.render()]);

        elements.viewButton.removeClass("hidden");
        elements.viewButton.click(
            viewButtonClickHandler);
    };

    hub.sub("app/route/pricingSimulator", render);
});
