define(["jquery", "app/hub", "app/dal", "moment", "app/util", "app/renderer", "app/viewManager",
    "app/dropdown", "app/attributeSlider", "app/repo/attrCache", "app/permissionEvaluator", "app/attributeSelector", "app/noty"],
function($, hub, dal, moment, util, Renderer, ViewManager, Dropdown, AttributeSlider, AttrCacheRepo, permEval, AttributeSelector, Noty) {
    return function(compName, route, title, illegalTypes) {


        var types;

        var attrSldrP;
        var typeP;

        var noSliders = MX.strings.get("sliderScreen_noSliders");
        var noAttrsError = MX.strings.get("sliderScreen_error_noAttrs");
        var attrConflictError = MX.strings.get("sliderScreen_error_attrConflict");
        var saveError = MX.strings.get("sliderScreen_error_saving");
        var savedMsg = MX.strings.get("sliderScreen_saved");

        var editable = permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD");

        var init = function() {
            attrSldrP = dal.get("attrSlider", { mpId: MX.session.creds.user.mp.id });
            typeP = AttrCacheRepo.get().then(attrCaches => {
                //first, map out the types
                types = attrCaches.map(attrCache =>
                    attrCache.type);

                //toss out apar (or asar) and illegal types
                types = types.filter(type =>
                    type.component.name == compName);

                if(illegalTypes)
                    types = types.filter(type =>
                        !(util.contains(illegalTypes, util.eq, type.name)));
            });
        };

        //function for attribute array equality
        var attrEq = (at1,at2) => {
            if(at1.length != at2.length)
                return false;
            return at1.map((curr) => at2.some((a) => a.id == curr.id)).reduce((sum,curr) => sum && curr);
        };

        var render = async function() {
            init();
            const page = ViewManager.renderView("attributeSliderScreen");

            var [el, attrSliders] = await Promise.all([page, attrSldrP]);

            var sliders = $("#sliders");
            $("#title").html(title);

            //toss out all the apar (or asar) sliders (they go in the other screen)
            attrSliders = attrSliders.filter(slider =>
                slider.inst.attributes.some((a) => a.type.component.name == compName));

            var originalSliders = attrSliders.map(util.cloneSimple);

            var table = attrSliders.map(slider =>
                new AttributeSlider($("<div>").appendTo(sliders), slider, editable));

            const sliderDeleteFunc = model => {
                table = table.filter(model.id
                    ? slider =>
                        slider.model.id != model.id
                    : slider =>
                        !attrEq(slider.model.inst.attributes, model.inst.attributes));
            };

            table.forEach(control => {
                control.render();
                if(control.model.id)
                    control.onDelete(sliderDeleteFunc);
            });

            if(attrSliders.length == 0)
                sliders.append($("<span>").attr("id","noSliderMsg").html(noSliders(compName)));

            //saves all alterations to previously existing sliders
            const saveSlider = async function(sliderControl) {
                if(!sliderControl.model.id) {
                    const savedSlider = await dal.post("attrSlider", sliderControl.model);
                    sliderControl.model = savedSlider;
                }

                return dal.put(`attrSlider/${sliderControl.model.id}`, sliderControl.model);
            };

            if(!editable)
                return;

            $("#saveButton").removeClass("hidden");

            await typeP;

            const caches = await Promise.all(
                types.map(t =>
                    AttrCacheRepo.get("", `/${t.id}`)));

            var attrSelector;

            var attrs = util.flatten(
                util.flatten(caches)
                    .map(c => c.attributes));

            const options = { orderAlpha: true };

            attrSelector = new AttributeSelector([], $("#attrSelector"), attrs, options);
            await attrSelector.render();

            $("#new").removeClass("hidden");

            $("#new").click(({ target }) => {
                $(target).addClass("hidden");
                $("#selectorControls").removeClass("hidden");
            });

            $("#create").click(() => {
                const newSliderObj = {
                    mp: { id: MX.session.creds.user.mp.id },
                    inst: { id: null, attributes: attrSelector.getData() },
                    sliderVal: 1.0
                };

                if(newSliderObj.inst.attributes.length < 1) {
                    Noty.error(noAttrsError);
                    return;
                }

                if(table.some(slider =>
                    attrEq(
                        slider.model.inst.attributes,
                        newSliderObj.inst.attributes)))
                {
                    Noty.error(attrConflictError);
                    return;
                }

                $("#new").removeClass("hidden");
                $("#selectorControls").addClass("hidden");
                $("#noSliderMsg").remove();

                const newSlider = new AttributeSlider($("<div>").appendTo(sliders), newSliderObj, editable);
                newSlider.onDelete(sliderDeleteFunc);

                table.push(newSlider);
                newSlider.render();
            });

            const save = element => {
                return saveSlider(element).catch(resp => {
                    Noty.closeAll();
                    Noty.error(util.errorMsg(saveError, resp));
                });
            };

            const instToKey = inst =>
                inst.attributes
                    .map(attr => attr.id)
                    .sort(util.numeric)
                    .map(id => `${id}`)
                    .join();

            $("#saveButton").click(async function() {
                Noty.closeAll();
                var deletedSliders = [];
                var slidersToSave = [];

                const originalSliderMap = util.toMap(originalSliders,
                    slider => instToKey(slider.inst), util.pipe);

                const newSliderMap = util.toMap(table,
                    slider => instToKey(slider.model.inst), util.pipe);

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

                Object.entries(newSliderMap)
                .filter(([key]) => !originalSliderMap[key])
                    .forEach(([, newVersion]) =>
                        slidersToSave.push(newVersion));

                deletedSliders
                    .filter(slider =>
                        slider.id)
                    .forEach(slider =>
                        dal.delete(`attrSlider/${slider.id}`));

                await Promise.all(slidersToSave.map(save));
                Noty.success(savedMsg);

                originalSliders = table.map(sliderControl =>
                    util.cloneSimple(sliderControl.model));
            });
        };

        hub.sub(`app/route/${route}`, render);
    };
});
