define(["jquery", "app/util", "c3"], function($, util, c3) {
    return function(options) {
        var exports = {};

        var defaults = {
            axes: {
                x: {
                    label: {
                        position: "outer-center"
                    }
                },
                y: {
                    label: {
                        position: "outer-middle"
                    }
                }
            }
        };

        var config = exports.config = Object.assign({}, defaults, options);

        var convertData = function(data) {
            return Object.keys(data).map(function(name) {
                return [name].concat(data[name]);
            });
        };

        var chart;
        var init = async function() {
            chart = await new Promise((resolve, reject) => {
                const c3Chart = c3.generate({
                    size: {
                        height: 420
                    },
                    data: {
                        x: "x",
                        columns: convertData(config.initialData)
                    },
                    axis: config.axes,
                    tooltip: {
                        format: {
                            title: config.tooltip
                        }
                    },
                    oninit: function() {
                        resolve(this);
                    }
                });
            });
        };
        init();

        const getRenderP = () =>
            new Promise((resolve, reject) =>
                chart.onrendered = () => {
                    resolve();
                    delete chart.onrendered;
                });

        exports.render = function() {
            const renderP = getRenderP();
            chart.element = $("#chart")[0];
            return renderP;
        };

        exports.update = function(data) {
            const renderP = getRenderP();

            chart.load({
                columns: convertData(data),
                unload: Object.keys(data)
            });

            return renderP;
        };

        return exports;
    };
});
