define(["app/renderer", "app/util", "moment", "app/dateRange", "app/dropdown", "app/attributeSelector", "app/repo/attr",
    "app/repo/attrCache", "app/dal"],
function(Renderer, util, moment, DateRange, Dropdown, AttributeSelector, AttrRepo, AttrCacheRepo, dal) {
    return function(container, initialParams, options, attrEndpoint) {
        const exports = {
            container,
            options,
            queryParams: initialParams,
            attrEndpoint
        };

        const controlName = "queryControl";

        const message = MX.strings.store[controlName];

        const internals = {};

        exports.validate = () => {
            //grab any errors from the date range control
            const errors = [...internals.dateRange.validate()];

            const { revealImpressionCount, requiredTypes } = exports.options;

            //if the impression count flag is there and the field is blank
            if(revealImpressionCount && isNaN(parseInt($("#minimum").val())))
                errors.push(message.error.invalidMinImp);

            //Check required attr types
            if(requiredTypes == null)
                return errors;

            const selectedAttrs = internals.aparSelector.getData()
                .concat(internals.asarSelector.getData());

            //equality between attribute and string
            const attrEq = (a, b) =>
                a.type.name == b;

            const allRequiredSatisfied = requiredTypes
                .every(type =>
                    util.contains(selectedAttrs, attrEq, type));

            if(!allRequiredSatisfied || selectedAttrs.length < requiredTypes.length)
                errors.push(message.error.emptyMediaType);

            return errors;
        };

        exports.getData = () => {
            const query = {};

            query.attributes = [
                ...internals.aparSelector.getData(),
                ...internals.asarSelector.getData()
            ].map(util.selectorFor("id"));

            query.start = internals.dateRange.getStart();
            query.end = internals.dateRange.getEnd();

            const { revealImpressionCount, revealMarketsDropdown } = exports.options;

            if(revealImpressionCount)
                query.quantity = parseInt($("#minimum").val());

            if(revealMarketsDropdown) {
                const selectedMarket = internals.marketsDropdown.selected.item;
                if(selectedMarket)
                    query.marketId = selectedMarket.id;
            }

            return query;
        };

        exports.resetSelectors = () => {
            internals.aparSelector.reset();
            internals.asarSelector.reset();
        };

        exports.render = async () => {
            const renderer = new Renderer(exports.container);

            const attrP = exports.attrEndpoint == "attrCache"
                ? AttrCacheRepo.get(exports.queryParams).then(attrs =>
                    util.flatten(attrs.map(
                        util.selectorFor("attributes"))))
                : AttrRepo.get(exports.queryParams);

            const viewP = renderer.renderView("queryParams");

            const [attrs] = await Promise.all([attrP, viewP]);

            const aparAttrs = attrs.filter(util.pred.attrIsInCategory("Placement"));
            const asarAttrs = attrs.filter(util.pred.attrIsInCategory("Audience"));

            internals.dateRange = new DateRange($("#dateRange"), options.dateTemplate);
            const dateRangeP = internals.dateRange.render().then(() => {
                //if the dates exist, set them
                if(exports.queryParams.start && exports.queryParams.end) {
                    //written this way for (some) clarity
                    internals.dateRange.setStart(moment(
                        exports.queryParams.start
                    ).toDate());

                    internals.dateRange.setEnd(moment(
                        exports.queryParams.end
                    ).toDate());
                }
            });

            const { revealImpressionCount, revealMarketsDropdown, requiredTypes, noEdit } = exports.options;

            if(revealImpressionCount) {
                $("#impTitle").removeClass("hidden");
                $("#minImpressions").removeClass("hidden");

                var minField = $("#minimum");
                minField.blur(() => {
                    var currentVal = minField.val();
                    currentVal = currentVal < 0
                        ? -currentVal
                        : (currentVal > 0
                            ? currentVal
                            : 1);
                    minField.val(currentVal);
                });
            }

            //set up attribute selectors
            const attrSelectorOptions = { requiredTypes, noEdit };

            internals.aparSelector = new AttributeSelector([], $("#aparSelector"), aparAttrs, attrSelectorOptions);
            internals.asarSelector = new AttributeSelector([], $("#asarSelector"), asarAttrs, attrSelectorOptions);

            const aparP = internals.aparSelector.render();
            const asarP = internals.asarSelector.render();

            //Render Market Dropdown if needed
            if(revealMarketsDropdown)
                await initMarketDropdown();

            return Promise.all([dateRangeP, aparP, asarP]);
        };

        const initMarketDropdown = () => {
            $("#marketsDropdownContainer").removeClass("hidden");

            return dal.get("market", { mpId: MX.session.creds.user.mp.id }).then(markets => {
                internals.marketsDropdown = new Dropdown(markets, {
                    container: $("#marketsDropdown"),
                    promptText: message.marketsDropdownText,
                    textField: "name",
                    valField: "id",
                    enableDefault: true
                });

                return internals.marketsDropdown.render();
            });
        };

        return exports;
    };
});
