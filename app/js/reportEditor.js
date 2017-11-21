define(["app/dal", "app/util", "app/list", "app/report/edit/index", "app/renderer"],
function(dal, util, List, ReportEdit, Renderer) {
    var dal = dal("api");

    return class ReportEditor {
        constructor() {
            this.resources = {};
            this.controls = {};
        }
        activate() {
            this.resources.reports = dal.get("plan/report");
            this.resources.metrics = dal.get("plan/metrics");
        }
        async render(container) {
            const renderer = new Renderer(container);

            const [renderedContainer, reports, metrics] = await Promise.all([
                renderer.renderTemplate("reportEditor"),
                this.resources.reports,
                this.resources.metrics]);

            this.controls.reportList = new List({
                container: $("#reportList"),
                items: reports,
                constructor: (...args) => new ReportEdit(...args, metrics),
                containerClass: "report"
            });

            return this.controls.reportList.render();
        }
    };
});
