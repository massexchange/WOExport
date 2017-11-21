define(["jquery", "app/util", "app/renderer", "app/dateRange", "app/dal", "app/dropdown", "app/collapsedCatalog", "app/repo/attrType", "app/noty"], 
function($, util, Renderer, DateRange, dal, Dropdown, CollapsedCatalog, AttrType, Noty) {
    
    return function(metaInfoContainer, model, contentContainer) {
        var exports = {
            container: metaInfoContainer,
            model: model,
            tableDiv: contentContainer
        };

        var savedMsg = MX.strings.get("invPackage_saved");
        var invalidASAR = MX.strings.get("invPackage_invalidASARPrice");
        var invalidAPAR = MX.strings.get("invPackage_invalidAPARPrice");
        var dealDropdownText = MX.strings.get("invPackage_dealDropdownText");
        var complianceDropdownText = MX.strings.get("invPackage_complianceDropdownText");
        var empty = MX.strings.get("invPackage_empty");

        var save = exports.save = function(successMsgLocation) {
            //implementation missing
            Noty.success(savedMsg);
            successMsgLocation.text(savedMsg);
        };

        var update = exports.update = function() {
            //precondition: there are no errors in the package metainfo
            exports.model.name = $("#name").val();
            exports.model.asarPrice = parseFloat($("#asarPrice").val());
            exports.model.aparPrice = parseFloat($("#aparPrice").val());
            exports.model.startDate = exports.dateRangeControl.getStart();
            exports.model.endDate = exports.dateRangeControl.getEnd();
            //other stuff will be dealt with when the backend for packages is implemented
        };

        var validate = exports.validate = function() {
            var errors = [];
            //see if there's anything wrong with the dates
            errors = errors.concat(exports.dateRangeControl.validate());
            //and check the price fields
            if(isNaN(parseFloat($("#asarPrice").val())))
                errors.push(invalidASAR);
            if(isNaN(parseFloat($("#aparPrice").val())))
                errors.push(invalidAPAR);
            //nothing yet to deal with the other fields
            return errors;  
        };

        var getDates = exports.getDates = function() {
            return {
                startDate: exports.dateRangeControl.getStart(),
                endDate: exports.dateRangeControl.getEnd()
            };
        };

        var renderDealDropdown = function() {
            //implementation missing, bogus dropdown is rendered
            exports.dealDropdown = new Dropdown([], {
                container: $("#dealDropdown"),
                promptText: dealDropdownText,
                textField: "name"
            });

            exports.dealDropdown.render();
        };

        var renderComplianceDropdown = function() {
            //implementation missing, bogus dropdown is rendered
            exports.complianceDropdown = new Dropdown([], {
                container: $("#complianceDropdown"),
                promptText: complianceDropdownText,
                textField: "name"
            });

            exports.complianceDropdown.render();
        };

        var renderContents = function(tableDiv) {
            //tack on the extra column
            var options = [
                {
                    name: "Remove",
                    accessor: function(collRec) { return collRec.catRecs[0]; },
                    type: "checkbox"
                }
            ];
            //create the table
            AttrType.getByLabel("Source").then((sources) => {
                var collTable = new CollapsedCatalog(tableDiv, exports.model.collRecs, util.noop, sources, options);
                if(exports.model.collRecs.length == 0)
                    tableDiv.text(empty);
                else 
                    collTable.render();
            });
        };

        var render = exports.render = function() {
            var renderer = new Renderer(exports.container);
            renderer.renderTemplate("inventoryPackage", {data: exports.model}).then(function(el) {
                exports.dateRangeControl = new DateRange($("#dateRange"), "inventoryPackageDateRange");
                exports.dateRangeControl.render().then(function() {
                    if(exports.model.startDate && exports.model.endDate)
                    {
                        exports.dateRangeControl.setStart(exports.model.startDate);
                        exports.dateRangeControl.setEnd(exports.model.endDate);
                    }
                });
                renderDealDropdown();
                renderComplianceDropdown();
                renderContents(exports.tableDiv);
            });
        };

        return exports;
    };
});
