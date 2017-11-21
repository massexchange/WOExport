define(["app/util", "app/util/render", "app/graphSlider", "app/list", "app/dropdown", "app/chart", "app/repo/rateCard",
    "app/repo/priceAdjustmentGraph", "app/renderer", "app/revenueManagerExclusion", "app/permissionEvaluator",
    "app/repo/unitType", "app/noty"],
function(util, renderUtil, GraphSlider, List, Dropdown, Chart, RateCardRepo, PriceAdjustmentGraphRepo,
    Renderer, RME, permEval, UnitTypeRepo, Noty) {
    return function(initialModel, options) {
        var exports = {
            model: util.cloneSimple(initialModel)
        };

        var promises = {};

        var lastSaved;

        var dropdownText = MX.strings.get("pag_adSizeDropdownText");
        var invalidError = MX.strings.get("pag_error_invalidSettings");
        var pagSaved = MX.strings.get("pag_saved");
        var dne = MX.strings.get("pag_error_doesntExist");

        var init = function() {
            promises.allUnitTypes = UnitTypeRepo.getAll();

            return Promise.all([promises.allUnitTypes]);
        };
        init();

        var selectors = {
            AdSizeDDContainer: "#adSizeDD",
            MessageContainer: "#message",
            SliderContainer: "#sliders",
            ExclusionContainer: "#exclusions",
            SaveButton: "#saveButton"
        };

        var controls = {
            AdSizeDD: {},
            DaySliderList: {},
            PriceChart: {},
            ExclusionControl: {}
        };

        const initControls = async function(elements) {
            const initDaySliderList = function() {
                const initDaySlider = function(container, slider) {
                    const control = GraphSlider(slider, {
                        container: container
                    });
                    return control;
                };

                exports.model.sliders = exports.model.sliders
                    .sort(util.mapCompare(
                        slider => slider.type,
                        util.comparator.unitType));

                controls.DaySliderList = new List({
                    container: elements.SliderContainer,
                    items: exports.model.sliders,
                    constructor: initDaySlider,
                    containerClass: "row"
                });
                return controls.DaySliderList.render();
            };

            const initAdSizeDD = async function(rateCard) {
                const adSizes = rateCard.rows[0].columns
                    .map(util.selectorFor("adSize"))
                    .filter(util.isNotNull).concat({ value: "Package", id: -1 })
                    .sort(util.mapCompare(
                        ({ value }) => value,
                        util.comparator.adSize));

                controls.AdSizeDD = new Dropdown(adSizes, {
                    container: elements.AdSizeDDContainer,
                    promptText: dropdownText,
                    textField: "value"
                });

                controls.AdSizeDD.change.subscribe(
                    updateChart);

                await controls.AdSizeDD.render();
                controls.AdSizeDD.selectByVal(adSizes[0].id, false);
            };

            var initChart = function() {
                controls.PriceChart = new Chart({
                    axes: {
                        x: {
                            label: {
                                text: "Days to Flight"
                            },
                            tick: {
                                fit: false,
                                format: function (value) { return -value; }
                            }
                        },
                        y: {
                            label: {
                                text: "Price"
                            },
                            tick: {
                                format: d3.format("$")
                            }
                        }
                    },
                    tooltip: function (d) {
                        return d == 0
                            ? "Flight Date"
                            : -d + " days to flight";
                    },
                    initialData: globalGenChartData()
                });
            };


            var initExclusions = function() {
                //if the exclusion control set was omitted from the options object,
                //create a blank one here
                controls.ExclusionControl = RME(elements.ExclusionContainer, exports.model.rme || {
                    id: null,
                    mp: exports.model.mp
                });
                return controls.ExclusionControl.render();
            };

            var initSliderListeners = function() {
                var sliders = controls.DaySliderList.children;

                var isUnder = function(presentValue, index, event) {
                    var otherInput = sliders[index + 1].config.container.find("input")[0];
                    var nextValue = parseInt(otherInput.value);
                    if(presentValue >= nextValue)
                    {
                        event.target.value = nextValue - 1;
                        event.preventDefault();
                        return false;
                    }
                    return true;
                };

                var isOver = function(presentValue, index, event) {
                    var otherInput = sliders[index - 1].config.container.find("input")[0];
                    var prevValue = parseInt(otherInput.value);
                    if(presentValue <= prevValue)
                    {
                        event.target.value = prevValue + 1;
                        event.preventDefault();
                        return false;
                    }
                    return true;
                };

                sliders.forEach((slider, index) => {
                    var limitsReached = function(e) {
                        var retVal = true;
                        var presentValue = parseInt(e.target.value);
                        if(index == 0) //First slider
                            retVal = isUnder(presentValue, index, e);
                        else if(index == exports.model.sliders.length - 1) //Last slider
                            retVal = isOver(presentValue, index, e);
                        else //Sliders in between
                            retVal = isUnder(presentValue, index, e) && isOver(presentValue, index, e);

                        slider.setGraphVal(30 - e.target.value);
                        updateChart();
                        return retVal;
                    };
                    slider.config.container.find("input")[0].addEventListener("input", limitsReached);
                });
            };

            await initDaySliderList();
            await initExclusions();
            await initAdSizeDD(exports.model.rateCard);
            initChart();
            initSliderListeners();
        };

        var validate = function() {
            var errors = [];

            var listControls = controls.DaySliderList.children;
            var length = listControls.length;
            for(var i = 0; i < length; i++)
            {
                if(i + 1 < length && listControls[i].model.day <= listControls[i + 1].model.day)
                {
                    errors.push(invalidError);
                    i = length;
                }
            }

            return errors;
        };

        var initElements = function(elements) {
            //watch out, fragile state-dependent side effects ahead
            lastSaved = initialModel;

            if(permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD")) {
                elements.SaveButton.removeClass("hidden");

                elements.SaveButton.click(async function() {
                    var errors = validate();

                    if(errors.length > 0) {
                        util.displayErrors(errors);
                        return;
                    }

                    exports.model.rme = controls.ExclusionControl.getData();

                    var passingVersion = util.cloneSimple(exports.model);
                    passingVersion.rateCard = {
                        id: passingVersion.rateCard.id
                    };

                    const savedGraph = await PriceAdjustmentGraphRepo.save(passingVersion);

                    exports.model.id = savedGraph.id,
                    //watch out, fragile state-dependent side effects ahead
                    lastSaved = savedGraph;

                    if(options.onSave)
                        options.onSave(savedGraph);
                    else
                        Noty.success(pagSaved);
                });
            }
        };

        var updateChart = function() {
            controls.PriceChart.update(globalGenChartData());
        };

        var globalGenChartData = function() {
            return genChartData(controls.AdSizeDD.selected.item, exports.model.rateCard);
        };

        var genChartData = function(adSize, rateCard) {
            var prices = getPrices(rateCard, adSize);

            return exports.model.sliders.map(util.selectorFor("type")).reduce(function(data, type) {
                data[type.longName] = buildColumn(prices, type);
                return data;
            }, {
                x: exports.model.sliders.map(util.compose(
                        util.negate,
                        util.selectorFor("day")
                    )).concat(0)
            });
        };

        var getPrices = function(rateCard, adSize) {
            return rateCard.rows.reduce(function(prices, row) {
                prices[row.type.longName] =
                    (adSize.id > 0
                        ? row.columns
                            .filter(util.compose(
                                util.isNotNull,
                                util.selectorFor("adSize")
                            )).filter(util.fieldIdEqTo("adSize", adSize))[0]
                        : row.packageColumn
                    ).price;

                return prices;
            }, {});
        };

        var buildColumn = function(prices, type) {
            var typeIndex = util.indexOf(exports.model.sliders, util.fieldEqTo("type", type));
            if(!util.isDefined(typeIndex))
                throw dne;

            var column = [];

            for(var i = 0, height = 0; i < 5; i++) {
                column.push(prices[exports.model.sliders[height].type.longName]);

                if(i < typeIndex)
                    height++;
            }

            return column;
        };

        exports.render = async function() {
            const renderer = new Renderer(options.container);
            const el = await renderer.renderTemplate("priceAdjustmentGraph", exports.model);

            exports.elements = renderUtil.selectElements(selectors);
            initElements(exports.elements);

            return initControls(exports.elements);
        };

        return exports;
    };
});
