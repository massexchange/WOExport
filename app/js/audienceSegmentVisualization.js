define(["jquery", "app/hub", "app/viewManager", "app/dal", "app/session", "d3",
    "moment", "d3-parsets", "app/util", "app/dropdown", "app/dateRange", "app/attributeTypeSelector", "app/spinner", "app/noty"],
function($, hub, ViewManager, dal, Session, d3, moment, parsets, util, Dropdown, DateRange, AttributeTypeSelector, Spinner, Noty) {
    // Only show this many types.
    var MAX_NUMBER_OF_TYPES = 3;

    var notEnoughData = MX.strings.get("audSegVis_notEnoughData");
    var notEnoughTypes = MX.strings.get("audSegVis_notEnoughTypes");
    var notEnoughAvailable = MX.strings.get("audSegVis_notEnoughDataAvailable");

    const render = function() {
        const renderP = ViewManager.renderView("audienceSegmentVisualization");
        const cachesP = dal.get("attrCache");

        return Promise.all([renderP, cachesP])
            .then(onRender);
    };

    var onRender = function([renderRes, cachesRes]) {
        var dateRange = new DateRange($("#dateRange"));
        dateRange.render().then(function() {
            var startMoment = moment().startOf("day");

            // Default value for the date range is the next full month.
            if (startMoment.date() != 1) {
                startMoment.date(1);
                startMoment.add(1, "months");
            }

            var endMoment = moment(startMoment);
            endMoment.add(1, "months");

            dateRange.setStart(startMoment.toDate());
            dateRange.setEnd(endMoment.toDate());
        });

        // TODO: Look only at types from the data?
        // then construct dropdowns
        var asarAttrTypes = cachesRes
            .filter(cache =>
                cache.type.component.name == "Audience")
            .map(({ type }) => type);

        // Restrict the type selector to at most 3 types.
        var typeSelector = new AttributeTypeSelector([], $("#attributeTypeSelector"), asarAttrTypes, MAX_NUMBER_OF_TYPES);
        if(asarAttrTypes.length < 2) {
            $("#attributeTypeSelector").text(notEnoughData);
            $("#render").hide();
            $("#dateRange").hide();
        } else
            typeSelector.render();

        $("#render").click(async function() {
            $("#response").empty();
            $("#parsetContainer").empty();
            var errors = dateRange.validate();

            if(typeSelector.getData().length < 2)
                errors.push(notEnoughTypes);

            if(errors.length > 0) {
                util.displayErrors(errors);
                return;
            }

            Noty.closeAll();
            Spinner.add($("#response"));

            const data = await dal.get("inv/audienceData", {
                startDate: dateRange.getStart(),
                endDate: dateRange.getEnd()
            });

            const chosenTypes = typeSelector.getData();
            renderParSet(data, chosenTypes);
            Spinner.remove($("#response"));
        });
    };

    var renderParSet = function(data, chosenTypes) {
        if(! util.isDefined(chosenTypes) ||
                chosenTypes.length === 0 ||
                chosenTypes.every(function(type) { return ! util.isDefined(type); }))
            // In this case just pick the first n types in data.
            chosenTypes = data.dimensions.slice(0, MAX_NUMBER_OF_TYPES);

        //Has to contain all chosen types
        const chosenTypeStrings = chosenTypes.map(({ name }) => name);

        const isChosen = types =>
            //Check if chosenTypes is subset of types
            chosenTypeStrings.every(typeString =>
                types.indexOf(typeString) >= 0);

        // Now filter data to just the chosen types.
        data.dimensions = data.dimensions
            .filter(dimen => chosenTypeStrings.indexOf(dimen) >= 0);

        data.typesAndValues = data.typesAndValues.filter(row =>
            isChosen(Object.keys(row.typeToValue)));

        if(data.dimensions.length <= 1 || data.typesAndValues.length <= 1) {
            Noty.error(notEnoughAvailable);
            return;
        }

        const chart = d3.parsets().dimensions(data.dimensions)
                            .value(function(obj) {
                                var foundElement = data.typesAndValues.filter(function(map) {
                                    var found = true;
                                    for(var type in obj)
                                        if(obj.hasOwnProperty(type))
                                            if(map.typeToValue[type] != obj[type])
                                                found = false;
                                    return found;
                                });

                                return foundElement.length > 0 ? foundElement[0].quantity : 0;
                            }).tooltip(function(d) {
                                var count = d.count,
                                path = [];
                                while (d.parent) {
                                    if (d.name) path.unshift(d.name);
                                        d = d.parent;
                                }

                                var impressionCount = d3.format(",f")(count);
                                var percentage = d3.format("%")(count / d.count);

                                return `<b>${path[0]} &rarr; ${path[1]}</b><br>Units: ${impressionCount} (${percentage})`;
                            });

        var vis = d3.select("#parsetContainer").append("svg")
            .attr("width", chart.width())
            .attr("height", chart.height());

        var valueData = data.typesAndValues.map(function(obj) {
            return data.dimensions.map(function(type) {
                return obj.typeToValue[type];
            });
        });

        valueData.unshift(data.dimensions); //d3.parsets expects first row to be the dimensions

        //Build csv
        var csvContent = "data:text/csv;charset=utf-8," +
            valueData.map(function(infoArray, index) {
               return infoArray.join(",");
            }).join("\n");
        var encodedUri = encodeURI(csvContent);

        d3.csv(encodedUri, function(error, csv) {
            vis.datum(csv).call(chart);
        });
    };

    hub.sub("app/route/audienceSegmentVisualization", render);
});
