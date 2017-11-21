define(["app/control", "app/dal", "app/clock", "app/util", "app/noty"], function(Control, dal, Clock, util, Noty) {
    const offsetParts = ["days", "hours", "minutes"];
    const offsetField = offset => $(`#${offset}Input`);

    return class ClockEditor extends Control {
        constructor() {
            super({
                template: "clockEditor",
                renderUpdates: true
            });

            const { render } = this.transitions;

            this.offsetClockMsg = MX.strings.get("admin_sysClockOffset");
            this.resetClockMsg = MX.strings.get("admin_sysClockReset");

            this.children.clock = new Clock();

            this.options.modelSource = this.children.clock.currentTime;

            render.addStep(() => {
                this.elements.setOffset
                    .click(this.setOffset);

                this.elements.resetClock
                    .click(this.resetOffset);
            });
        }
        renderUpdate(viewModel) {
            this.elements.clock.html(viewModel);
        }
        setOffset() {
            const offsets = util.mapTo(offsetParts,
                offset => offsetField(offset).val());

            return dal.post("admin/clock/offset", offsets)
                .then(({ epochSecond }) => {
                    Noty.success(this.offsetClockMsg);
                    this.children.clock.unixTime = epochSecond;

                    offsetParts.map(offsetField)
                        .forEach(field => field.val(""));
                });
        }
        resetOffset() {
            return dal.post("admin/clock/reset")
                .then(({ epochSecond }) => {
                    Noty.success(this.resetClockMsg);
                    this.children.clock.unixTime = epochSecond;
                });
        }
    };
});
