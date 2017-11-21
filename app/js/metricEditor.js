define(["app/renderer", "app/list", "app/dal", "app/metric/edit/index", "app/util", "app/noty"],
function(Renderer, List, dal, MetricEdit, util, Noty) {
    return class MetricEditor {
        constructor() {
            this.resources = {};
            this.controls = {};
            this.laundryHamper = {};

            this.saved = MX.strings.get("metricEditor_saved");
        }
        activate() {
            this.resources.metrics = dal.get("plan/metrics");
            this.resources.metricTypes = dal.get("plan/metrics/types");
        }
        async render(container) {
            const [, metrics, types] = await Promise.all([
                new Renderer(container).renderTemplate("metricEditor"),
                this.resources.metrics,
                this.resources.metricTypes]);

            this.model = metrics;
            this.controls.metricList = new List({
                container: $("#metricList"),
                items: metrics,
                constructor: (container, metric) => {
                    const editor = new MetricEdit(container, metric, types);

                    //when the user changes the type, set it and mark as dirty
                    editor.change.subscribe(({ item: newType }) => {
                        metric.type = newType.value;
                        this.laundryHamper[metric.name] = metric;
                    });

                    return editor;
                },
                containerClass: "metric"
            });

            await this.controls.metricList.render();
            $("#saveMetrics").click(
                this.save.bind(this));
        }
        async save() {
            await Promise.all(Object.values(this.laundryHamper)
                .map(dirtyMetric =>
                    dal.put(`plan/metrics/${dirtyMetric.id}/type`, dirtyMetric.type)));

            this.laundryHamper = {};

            Noty.success(this.saved);
        }
    };
});
