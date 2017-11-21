define(["jquery", "app/hub", "app/dal", "app/util", "app/renderer", "app/viewManager",
    "app/mappingsTable", "app/mappingOutputsTable", "app/permissionEvaluator", "app/dropdown"],
function($, hub, dal, util, Renderer, ViewManager, MappingsTable, MappingOutputsTable, permEval, Dropdown) {


    var mappings;
    var currentlySelected = {
        parent: null,
        model: null
    };

    var mpsDropdown;

    var render = async function() {
        var showMappings = async function(mpId) {
            renderMappings(
                await dal.get("mappings", { mpId }));
        };

        await ViewManager.renderView("mappings");

        if(permEval.isMXAdmin(MX.session.creds.user)) {
            const mps = await dal.get("mp");
            mpsDropdown = new Dropdown(mps, {
                container: $("#mpsDropdown"),
                promptText: MX.strings.get("mappings_mpDropdownText"),
                textField: "name"
            });

            mpsDropdown.render();
            mpsDropdown.change.subscribe(({ val }) =>
                showMappings(val));
        } else
            showMappings(MX.session.creds.user.mp.id);
    };

    var renderMappings = function(mappingsResult) {
        mappings = mappingsResult;
        var mappingsInputTable = new MappingsTable(mappings, $("#mappingsInputTable"), onMappingRowClick);
        mappingsInputTable.render();

        $("#newMapping").click(function() {
            $("#newMappingContainer").removeClass("hidden");
            $("#newMapping").addClass("hidden");
        });

        $("#saveNewMapping").click(async function() {
            const newMapping = {
                mp: { id: mpsDropdown.selected.val },
                inputAttribute: {
                    key: $("#newMappingKey").val(),
                    value: $("#newMappingValue").val()
                },
                outputAttributes: []
            };
            const savedMapping = await dal.post("mappings", newMapping);
            mappings.push(savedMapping);
            mappingsInputTable = new MappingsTable(mappings, $("#mappingsInputTable"), onMappingRowClick).render();

            $("#newMappingContainer").addClass("hidden");
            $("#newMapping").removeClass("hidden");

            $("#newMappingKey").val("");
            $("#newMappingValue").val("");

            currentlySelected = { "parent": null, "model": null };
            $("#mappingOutputsTable").empty();
        });

        $("#deleteMapping").click(async () => {
            await dal.delete(`mappings/${currentlySelected.model.id}`, currentlySelected.model);

            mappings = mappings.filter(
                util.pred.not(
                    util.idEqTo(
                        currentlySelected.model)));

            currentlySelected = {
                parent: null,
                model: null
            };

            mappingsInputTable = await new MappingsTable(mappings, $("#mappingsInputTable"), onMappingRowClick).render();

            $("#mappingOutputsTable").empty();

        });

        $("#newOutput").click(function() {
            $("#newOutputsContainer").removeClass("hidden");
            $("#newOutput").addClass("hidden");
        });

        $("#saveNewOutput").click(async () => {
            currentlySelected.model.outputAttributes.push({
                key: $("#newOutputKey").val(),
                value: $("#newOutputValue").val()
            });

            const savedMapping = await dal.put(`mappings/${currentlySelected.model.id}`, currentlySelected.model);
            renderMappingOutputsTable(savedMapping);
            $("#newOutputsContainer").addClass("hidden");
            $("#newOutput").removeClass("hidden");

            $("#newOutputKey").val("");
            $("#newOutputValue").val("");
        });
    };

    var onMappingRowClick = function(html, rowModel) {
        html.click(function(e) {
            if(currentlySelected.parent != null)
                if(currentlySelected.model.id != rowModel.id)
                    currentlySelected.parent.removeClass("selectedRow");
                else
                    return;

            $("#mappingOutputsControls").removeClass("hidden");

            html.parent().addClass("selectedRow");

            currentlySelected.parent = html.parent();
            currentlySelected.model = rowModel;

            renderMappingOutputsTable(rowModel);
        });
    };

    var onOutputRemoveClick = function(html, rowModel) {
        var button = html.find("input[type='button']");
        button.click(util.partialLeft(removeOutput, rowModel));
    };

    var removeOutput = async function(output) {
        currentlySelected.model.outputAttributes = currentlySelected.model.outputAttributes.filter(function(out) {
            return out.key != output.key && out.value != output.value;
        });

        const mapping = await dal.put(`mappings/${currentlySelected.model.id}`, currentlySelected.model).then();
        return renderMappingOutputsTable(mapping);
    };

    var renderMappingOutputsTable = function(mapping) {
        var mappingOutputsTable = new MappingOutputsTable(mapping.outputAttributes, $("#mappingOutputsTable"), onOutputRemoveClick);
        return mappingOutputsTable.render();
    };

    hub.sub("app/route/mappings", render);
});
