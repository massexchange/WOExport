define(["jquery", "app/hub", "app/dal", "moment", "app/util", "app/renderer", "app/session", "app/viewManager",
    "app/dropdown", "app/sliderScreen", "app/repo/attrType"],
function($, hub, dal, moment, util, Renderer, Session, ViewManager, Dropdown, SliderScreen, AttrTypeRepo) {
    const bans = ["MediaType", "AdSize", "Section"];

    Promise.all([
        AttrTypeRepo.getByLabel("Source"),
        AttrTypeRepo.getByLabel("Owner")
    ]).then(([sources, owners]) =>
        new SliderScreen("Placement", "aparAttributeSliderScreen", "PLACEMENT SLIDER MANAGER", [
            ...bans,
            ...[...sources, ...owners].map(t => t.name)
        ]));
});
