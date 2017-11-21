define(["jquery", "app/hub", "app/viewManager", "app/dal", "app/session", "app/util", "app/renderer",
    "moment", "app/spinner", "app/dropdown", "app/noty"],
function($, hub, ViewManager, dal, Session, util, Renderer, moment, Spinner, Dropdown, Noty) {
    var exports = {};


    var result;
    var mpDropdown;

    var importInitiated = MX.strings.get("import_initiated");
    var importError = MX.strings.get("import_error");
    var importProcessing = MX.strings.get("import_processing");
    var dfpError = MX.strings.get("import_dfpError");
    var dfpImportStarted = MX.strings.get("import_dfpStarted");
    var dropdownText = MX.strings.get("import_mpDropdownText");
    var regenerating = MX.strings.get("import_regenerating");

    var initFile = type => {
        var container = $(`#${type}`);

        var button = container.find("input[type=button]");
        var upload = container.find("input[type=file]");

        button.click(() => upload.click());

        upload.change(async function() {
            try {
                Spinner.add(result);

                await dal.put(`acquisition/${type}?mpId=${mpDropdown.selected.val}&fullPass=${$("#fullPassCB").is(":checked")}`,
                    util.toFormData({ file: this.files[0] }));

                Noty.alert(importInitiated(type));
            } catch(err) {
                Noty.error(importError);
            } finally {
                Spinner.remove(result);
            }
        });
    };

    var initDFP = skip => {
        const mbSkip = skip ? "" : "Skip";
        $(`#report${mbSkip}`).click(async () => {
            try {
                Noty.alert(dfpImportStarted);

                // TODO This does not yet check for valid input
                await dal.post(`acquisition/dfp/${mbSkip.toLowerCase()}`, {
                    start: moment($("#startDateInput").val()),
                    end: moment($("#endDateInput").val()),
                    publisher: $("#publisherInput").val(),
                    publication: $("#publicationInput").val(),
                    mp: mpDropdown.selected.item,
                    fullPass: $("#fullPassCB").is(":checked")
                });

                Spinner.remove(result);
                Noty.alert(importProcessing);
            } catch(error) {
                Spinner.remove(result);
                Noty.error(dfpError);
            }
        });
    };

    var onRender = async function() {
        result = $("#result");

        //grab all publisher MPs
        const mpList = await dal.get("mp", { role: "PUBLISHER" });

        //instantiate dropdown
        mpDropdown = new Dropdown(mpList, {
            container: $("#mpsDropdown"),
            promptText: dropdownText,
            textField: "name"
        });

        $("#regenerate").click(function() {
            dal.post(`acquisition/regenerateCollapsed/${mpDropdown.selected.val}`);
            Noty.alert(regenerating);
        });

        //render
        await mpDropdown.render();

        initDFP(true);
        initDFP(false);

        mpDropdown.change.subscribe(({ item: mp }) => {
            initFile("excel");
            initFile("csv");
            initFile("excelSkip");
            initFile("csvSkip");
        });
    };

    var render = exports.render = function() {
        ViewManager.renderView("import").then(onRender);
    };

    hub.sub("app/route/import", render);

    return exports;
});
