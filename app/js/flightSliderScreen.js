define(["jquery", "app/hub", "app/dal", "moment", "app/util", "app/renderer", "app/session", "app/viewManager",
    "app/dropdown", "app/flightSlider", "app/dateRange", "app/repo/attrCache", "app/repo/attrType", "app/permissionEvaluator", "app/noty"],
function($, hub, dal, moment, util, Renderer, Session, ViewManager, Dropdown, FlightSlider, DateRange, AttrCacheRepo, AttrTypeRepo, permEval, Noty) {


    var flightP;
    var sourcesP;

    var deletedSliders = [];
    var originalSliders = [];

    var noSliders = MX.strings.get("flSliderScreen_noSliders");
    var alreadyExists = MX.strings.get("flSliderScreen_alreadyExists");
    var noSource = MX.strings.get("flSliderScreen_noSource");
    var dropdownText = MX.strings.get("flSliderScreen_dropdownText");
    var slidersSaved = MX.strings.get("flSliderScreen_saved");

    var editable = permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD") ||
                    permEval.hasPermission(MX.session.creds.user, "ROLE_MX_ADMIN") ||
                    permEval.hasPermission(MX.session.creds.user, "ROLE_MP_ADMIN");

    var init = function() {
        flightP = dal.get("flightSlider", { mpId: MX.session.creds.user.mp.id });
        sourcesP = AttrTypeRepo.getByLabel("Source").then((types) =>
            Promise.all(types.map(({ name }) =>
                AttrCacheRepo.getAttributes(name)
            )).then((caches) =>
                util.flatten(caches)));
    };
    init();

    var render = async function() {
        const page = ViewManager.renderView("flightSliderScreen");
        const [el, flightSliders] = await Promise.all([page, flightP]);
        var dateRange = new DateRange($("#dateRange"));
        dateRange.render();

        var table = flightSliders.map(function(slider) {
            var sliderDiv = $("<div>").appendTo($("#flightSliders"))
                .addClass("sliderDiv flightSliderDiv");
            return new FlightSlider(sliderDiv, slider, editable);
        });
        originalSliders = table.map((sliderControl) => util.cloneSimple(sliderControl.model));

        if(flightSliders.length == 0)
            $("#flightSliders").append($("<span>").attr("id","noSliderMsg").html(noSliders));

        const sliderDeleteFunc = function(model) {
            if(model.id)
                table = table.filter((slider) => slider.model.id != model.id);
            else
                table = table.filter(slider =>//instruments here are assumed to be singletons.
                    slider.model.inst.attributes[0].id != model.inst.attributes[0].id &&
                    !(slider.model.startDate == model.startDate &&
                    slider.model.endDate == model.endDate));
        };

        table.forEach(control => {
            control.render().then(() => {
                if(!editable) {
                    control.container.find(".delete").prop("hidden", true);
                    control.deleteHandler = util.noop;
                    control.container.find(".slider").prop("disabled", true);
                }
            });
            if(control.model.id && editable)
                control.onDelete(sliderDeleteFunc);
        });

        if(!editable)
            return;

        sourcesP.then(sources => {
            //again, assuming singleton insts
            const checkForExistingSliders = function(selectedAttr, errors) {
                const desiredStart = moment(dateRange.getStart());//.slice(0,10);
                const desiredEnd = moment(dateRange.getEnd());//.slice(0,10);

                table.some(slider => {
                    if(moment(slider.model.startDate).isSame(desiredStart) &&
                    moment(slider.model.endDate).isSame(desiredEnd) &&
                    slider.model.inst.attributes[0].id == selectedAttr.id)
                        errors.push(alreadyExists);
                });
                return errors;
            };

            const create = ({ item, val }) => {
                var errors = dateRange.validate();
                if(val == 0)
                    errors.push(noSource);

                errors = checkForExistingSliders(item, errors);
                if(errors.length > 0) {
                    util.displayErrors(errors);
                    ddSources.reset(false);
                    return;
                }

                $("#noSliderMsg").remove();
                createSlider();

                ddSources.reset(false);
                dateRange.reset();
            };

            const createSlider = function() {
                const newSliderObj = {
                    mp: {
                        id: MX.session.creds.user.mp.id
                    },
                    //per Zeno, this is still intended to cover single "source" attributes inside
                    //a singleton instrument.
                    inst: { attributes:[ddSources.selected.item] },
                    startDate: dateRange.getStart(),
                    endDate: dateRange.getEnd(),
                    sliderVal: 1.0
                };

                const sliderDiv = $("<div>").appendTo($("#flightSliders"))
                    .addClass("sliderDiv flightSliderDiv");

                const newSlider = new FlightSlider(sliderDiv, newSliderObj, editable);
                newSlider.render();
                newSlider.onDelete(sliderDeleteFunc);
                table.push(newSlider);

                $("#sourceDD").addClass("hidden");
                $("#dateRange").addClass("hidden");
                $("#create").addClass("hidden");
                $("#createNew").removeClass("hidden");

                Noty.closeAll();
            };

            const ddSources = new Dropdown(sources, {
                container: $("#sourceDD"),
                promptText: dropdownText,
                textField: "value"
            });

            ddSources.render().then(() => {
                ddSources.change.subscribe(create);
            });

            $("#createNew").click(function() {
                //hide the create new button
                $("#createNew").addClass("hidden");
                //clear save message
                //show hidden divs
                $("#dateRange").removeClass("hidden");
                $("#create").removeClass("hidden");
                $("#sourceDD").removeClass("hidden");
            });

            $("#createNew").removeClass("hidden");
        });

        const sliderToKey = slider =>
            `${slider.inst.attributes[0]},${slider.startDate},${slider.endDate}`;

        $("#saveButton").removeClass("hidden");
        $("#saveButton").click(async function() {
            Noty.closeAll();

            deletedSliders = [];
            var slidersToSave = [];

            var originalSliderMap = util.toMap(originalSliders, sliderToKey);
            var newSliderMap = util.toMap(table,
                ({ model }) => sliderToKey(model));

            Object.entries(originalSliderMap).forEach(([key, originalVersion]) => {
                var newVersion = newSliderMap[key];
                if(!newVersion) {
                    deletedSliders.push(originalVersion);
                    return;
                }
                if(newVersion.model.sliderVal != originalVersion.sliderVal) {
                    newVersion.id = originalVersion.id;
                    slidersToSave.push(newVersion);
                }
            });
            Object.entries(newSliderMap).forEach(([key, originalVersion]) => {
                var newVersion = newSliderMap[key];
                if(!originalVersion)
                    slidersToSave.push(newVersion);
            });

            deletedSliders
                .map(({ id }) => id)
                .filter(util.isDefined)
                .forEach(id =>
                    dal.delete(`flightSlider/${id}`));

            deletedSliders = [];

            await Promise.all(table.map(save));

            Noty.success(slidersSaved);
            $("#sourceDD").addClass("hidden");
            $("#dateRange").addClass("hidden");
            $("#create").addClass("hidden");
            $("#createNew").removeClass("hidden");
            originalSliders = table.map(sliderControl =>
                util.cloneSimple(sliderControl.model));
        });
    };

    const save = element =>
        saveSlider(element);

    //saves all alterations to previously existing sliders
    const saveSlider = function(sliderControl) {
        if(!sliderControl.model.id)
            return dal.post("flightSlider", sliderControl.model).then(function(savedSlider) {
                sliderControl.model = savedSlider;
            });

        return dal.put(`flightSlider/${sliderControl.model.id}`, sliderControl.model);
    };

    hub.sub("app/route/flightSliderScreen", render);
});
