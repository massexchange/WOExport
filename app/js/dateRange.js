define(["app/renderer", "moment", "app/util"],
function(Renderer, moment, util) {
    return function(container, template = "dateRangeSelector") {
        var dateRange = {
            container: container
        };

        var internals = {};

        var startBeforeToday = MX.strings.get("dateRange_error_startBeforeToday");
        var endBeforeStart = MX.strings.get("dateRange_error_endBeforeStart");
        var emptyStart = MX.strings.get("dateRange_error_emptyStart");
        var emptyEnd = MX.strings.get("dateRange_error_emptyEnd");

        dateRange.render = async () => {
            const renderer = new Renderer(dateRange.container);
            const el = await renderer.renderView(template);

            internals.startEl = el.parent().find("#start");
            internals.endEl = el.parent().find("#end");
        };

        var fieldGetter = fieldName => () =>
            moment.utc(internals[`${fieldName}El`].val())
                .format(MX.dateTransportFormat);

        dateRange.getStart = fieldGetter("start");
        dateRange.getEnd = fieldGetter("end");

        var fieldSetter = fieldName => date =>
            internals[`${fieldName}El`][0].valueAsDate = date;

        dateRange.setStart = fieldSetter("start");
        dateRange.setEnd = fieldSetter("end");

        dateRange.reset = () => {
            dateRange.setStart(null);
            dateRange.setEnd(null);
        };

        //spew a list of error messages
        dateRange.validate = overrideValidationFunc => {
            if(overrideValidationFunc)
                return overrideValidationFunc(dateRange.getStart(), dateRange.getEnd());

            var errors = [];
            var fieldMissing = false;

            var start = moment(internals.startEl.val());
            var end = moment(internals.endEl.val());

            if(start._d == "Invalid Date")
                fieldMissing = util.pushError(emptyStart, errors);
            if(end._d == "Invalid Date")
                fieldMissing = util.pushError(emptyEnd, errors);

            if(fieldMissing)
                return errors;

            var today = moment().startOf("day");
            if(start.diff(today, "days") < 0)
                errors.push(startBeforeToday);
            if(end.diff(start, "days") < 0)
                errors.push(endBeforeStart);

            return errors;
        };

        return dateRange;
    };
});
