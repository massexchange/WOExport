define(["jquery", "app/hub", "app/dal", "app/spinner", "app/table", "app/viewManager", "app/util"],
function($, hub, dal, Spinner, Table, ViewManager, util) {
    var dal = dal("api");

    var resources = {};
    var elements = {};
    var controls = {};

    var noValsFound = MX.strings.get("planVal_noValsFound");

    var init = () => {
        resources.report = dal.get("plan/report", { name: "PMP Valuation" });
    };
    init();

    var formatValuations = (columns, valuations) => {
        var isValidCol = util.memberOf(columns, "id");
        var metricIdSelector = metricVal => metricVal.metric.id;
        var columnPosition = util.toMap(columns, util.idSelector, (col, pos) => pos);
        return valuations.map(valuation =>
            valuation.metrics.filter(util.compose(isValidCol, metricIdSelector))
                .sort(util.comparator.lookup(columnPosition, metricIdSelector))
                .reduce((values, metricVal) => {
                    values[metricVal.metric.name] = {
                        value: metricVal.value,
                        type: metricVal.metric.type
                    };
                    return values;
                }, {
                    "Name": { value: valuation.source.name, type: "string" },
                    "Rating": { value: valuation.rating, type: "string" }
                }));
    };

    var onRender = () => {
        elements.valuationContainer = $("#valuations");
        elements.tableContainer = $("#tableContainer");

        Spinner.add(elements.valuationContainer);

        resources.report.then(report => {
            if(report.valuations.length == 0) {
                elements.valuationContainer.text(noValsFound);
                return;
            }

            var rows = formatValuations(report.columns, report.valuations);
            var typeTemplates = {
                "Currency": "price",
                "Ratio": "percent",
                "Score": "metricScore"
            };
            var columns = Object.keys(rows[0]).map(column => ({
                name: column,
                accessor: row => {
                    var metricValue = row[column];
                    return metricValue
                        ? metricValue.value
                        : "";
                },
                type: typeTemplates[rows[0][column].type] || "string"
            }));
            controls.ValuationTable = new Table(elements.tableContainer, rows, columns, false, true);
            controls.ValuationTable.render().then(() => {
                Spinner.remove(elements.valuationContainer.removeClass("centerContent"));
                elements.tableContainer.removeClass("invisible");
            });
        });
    };

    var render = function() {
        ViewManager.renderTemplate("valuations").then(onRender);
    };

    hub.sub("app/route/planPmpValuation", render);
});
