define(["jquery", "app/util", "app/router", "app/renderer", "moment", "app/attributeSelector", "app/dal", "app/repo/attr", "app/matchTable", "app/dateRange", "app/dropdown", "app/permissionEvaluator", "app/noty"],
function($, util, Router, Renderer, moment, AttributeSelector, dal, AttrRepo, MatchTable, DateRange, Dropdown, permEval, Noty) {
    return function(group, camp) {
        const exports = {};
        /*{
            model //the group
            getData()
            render()
            setRenderer()
        }*/

        const usedBudget = camp.orderGroups.map(group =>
            group.qty * group.asarPrice + group.aparPrice
        ).reduce((sum, curr) => sum + curr, 0.0);

        exports.availableBudget = camp.budget - usedBudget;

        exports.model = group;
        if(!exports.model.status) exports.model.status = "Unsubmitted";

        const dateFormat = "YYYY-MM-DD";

        //declaring useful variables
        var dateRangeControl;
        var aparSelector;
        var asarSelector;
        var marketsDropdown;

        var renderer;
        exports.setRenderer = function(rend) {
            renderer = rend;
        };

        const MAX_PRICE = 99999999999.99;
        const MAX_QTY = 9999999999;

        const marketClosedMsg = MX.message.marketClosed;

        const message = MX.strings.store["og"];
        const messageDR = MX.strings.store["dateRange"];

        const extractAttrsByCategory = function(group, category) {
            if(group.selectedAttrs && group.selectedAttrs.attributes)
                return group.selectedAttrs.attributes
                    .filter(util.pred.attrIsInCategory(category));

            return [];
        };

        exports.render = async function() {
            exports.editing = exports.model.hasOwnProperty("id");

            if(exports.editing) {
                exports.model.flightStartDate = util.utcTime(exports.model.flightStartDate).format(dateFormat);
                exports.model.flightEndDate = util.utcTime(exports.model.flightEndDate).format(dateFormat);
            } else {
                //if we're creating a new group, set the flight range to the next two days
                exports.model.flightStartDate = moment().add(1, "days").format(dateFormat);
                exports.model.flightEndDate = moment().add(2, "days").format(dateFormat);
            }

            const el = await renderer.renderTemplate("orderGroup", exports.model);

            //date range constrol construction and promise
            dateRangeControl = new DateRange($("#dateRange"), "orderGroupDateRange");
            dateRangeControl.render().then(function() {
                dateRangeControl.setStart(util.utcTime(group.flightStartDate).toDate());
                dateRangeControl.setEnd(util.utcTime(group.flightEndDate).toDate());
            });

            dal.get("market/status").then(state => {
                if(!state.open)
                    $("#results").append($("<span>").html(marketClosedMsg));
            });

            const attrs = await AttrRepo.get();

            //split into asar vs apar
            const aparAttrs = attrs.filter(util.pred.attrIsInCategory("Placement"));
            const asarAttrs = attrs.filter(util.pred.attrIsInCategory("Audience"));

            //initial attr lists
            const orderAparAttrs = extractAttrsByCategory(exports.model, "Placement");
            const orderAsarAttrs = extractAttrsByCategory(exports.model, "Audience");

            const attrSelectorOptions = {};

            if(exports.model.status == "Submitted" || exports.model.status == "Matched")
                attrSelectorOptions.noEdit = true;

            aparSelector = new AttributeSelector(orderAparAttrs, $("#aparSelector"), aparAttrs, attrSelectorOptions);
            asarSelector = new AttributeSelector(orderAsarAttrs, $("#asarSelector"), asarAttrs, attrSelectorOptions);

            //render promises
            const aparP = aparSelector.render();
            const asarP = asarSelector.render();

            //Get and render markets dropdown
            const markets = await dal.get("market", { mpId: MX.session.creds.user.mp.id });
            marketsDropdown = new Dropdown(markets, {
                container: $("#marketsDropdown"),
                promptText: message.marketDropdownText,
                textField: "name",
                valField: "id"
            });

            await marketsDropdown.render();

            Promise.all([aparP, asarP])
                .then(init(el));
        };

        var init = el => () => {
            var disableAll = function() {
                $("input", el).attr("disabled", "disabled");
                $("#marketsDropdown select").attr("disabled", "disabled");
            };
            var btnSave = $("#saveButton");
            var btnSubmit = $("#submitButton");

            const failHandler = function() {
                btnSave.val(MX.strings.store.save.enabled);
                btnSave.prop("disabled", false);
            };

            const create = async function(group) {
                try {
                    const newGroup = await dal.post(`campaign/${camp.id}/orders`, group);

                    Router.navigate(`campaigns/${camp.id}/orderGroup/${newGroup.id}`);
                    exports.model = newGroup;
                    exports.editing = true;

                    Noty.success(message.created);
                } finally {
                    failHandler();
                }
            };

            const update = async function(group, noRedirect) {
                try {
                    const updatedGroup = await dal.put(`orderGroup/${group.id}`, group);
                    exports.model = updatedGroup;

                    Noty.success(message.saved);

                    if(!noRedirect)
                        Router.navigate(`campaigns/${camp.id}`, true);
                } finally {
                    failHandler();
                }
            };

            const enableSave = function() {
                if(!exports.editing)
                    btnSave.val("Create");

                btnSave.removeClass("hidden").click(function() {
                    const group = getData();

                    Noty.closeAll();

                    var errors = validate(group);
                    if(errors.length > 0) {
                        util.displayErrors(errors);
                        return;
                    }

                    btnSave
                        .val(exports.editing
                            ? MX.strings.store.save.processing
                            : "Create")
                        .prop("disabled", true);

                    (exports.editing
                        ? update
                        : create)(group);
                });
            };

            var enableSubmit = function() {
                btnSubmit.removeClass("hidden").click(async () => {
                    const group = getData();

                    Noty.closeAll();

                    var errors =  validate(group);
                    if(errors.length > 0) {
                        util.displayErrors(errors);
                        return;
                    }

                    //First save any changes made
                    await update(group, true);

                    //Then submit the ordergroup to selected market
                    const submittedGroup = await dal.post(`market/${marketsDropdown.selected.val}/orders/group/${exports.model.id}`);

                    btnSave.add(btnSubmit).remove();
                    disableAll();

                    const matched = submittedGroup.matches && submittedGroup.matches.length > 0;

                    Noty.success(matched
                        ? message.matched
                        : message.savedToBook);

                    // We're done with this screen, go back up to the SB's screen.
                    Router.navigate(`campaigns/${camp.id}`, true);
                });
            };

            const enableAttrReset = function() {
                $("#resetAttributes").removeClass("hidden").click(function() {
                    aparSelector.reset();
                    asarSelector.reset();
                });
            };

            const blurInputs = function() {
                $("#aparPrice").blur(function() {
                    this.value = util.roundPrice(this.value, MAX_PRICE);
                });
                $("#asarPrice").blur(function() {
                    this.value = util.roundPrice(this.value, MAX_PRICE);
                });
                $("#qty").blur(function() {
                    this.value = util.roundPrice(this.value, MAX_QTY);
                });
            };

            if(!exports.editing) {
                enableSave();
                enableAttrReset();
                blurInputs();
            }
            else if(exports.editing && exports.model.status == "Unsubmitted"
                    && (permEval.hasPermission(MX.session.creds.user, "ROLE_TEAM_ADMIN") || permEval.hasPermission(MX.session.creds.user, "ROLE_BUYER")))
            {
                enableSave();
                enableAttrReset();
                enableSubmit();
                blurInputs();
            } else
                disableAll();

            if(exports.model.matches && exports.model.matches.length > 0) {
                const matchTable = new MatchTable($("#matches"), exports.model.matches);
                matchTable.render();
            }

            //Select market in dropdown if there is one
            marketsDropdown.selectByVal(exports.model.marketId || 1, false);

            return el;
        };

        const validate = function(group) {
            const errors = [];
            var fieldMissing = false;

            const today = util.utcTime().startOf("day");

            if($("#start").val() == "")
                fieldMissing = util.pushError(messageDR.error.emptyStart, errors);
            else if(!moment(group.flightStartDate).isValid())
                fieldMissing = util.pushError(messageDR.error.invalidStart, errors);

            if($("#end").val() == "")
                fieldMissing = util.pushError(messageDR.error.emptyEnd, errors);
            else if(!moment(group.flightEndDate).isValid())
                fieldMissing = util.pushError(messageDR.error.invalidEnd, errors);

            if(group.aparPrice == null || isNaN(group.aparPrice))
                fieldMissing = util.pushError(message.error.noAPARPrice, errors);

            if(group.asarPrice == null || isNaN(group.asarPrice))
                fieldMissing = util.pushError(message.error.noASARPrice, errors);

            if(group.qty == null || isNaN(group.qty))
                fieldMissing = util.pushError(message.error.noQuantity, errors);

            if(group.marketId == null || group.marketId == 0)
                fieldMissing = util.pushError(message.error.noMarket, errors);

            if(fieldMissing)
                return errors;

            if(util.utcTime(group.flightStartDate).isBefore(today))
                errors.push(message.error.startBeforeToday);
            else if(util.utcTime(group.flightStartDate).isSame(today))
                errors.push(message.error.startSameToday);
            if(util.utcTime(group.flightEndDate).isBefore(today))
                errors.push(message.error.endBeforeToday);
            else if(util.utcTime(group.flightEndDate).isSame(today))
                errors.push(message.error.endSameToday);

            if(util.utcTime(group.flightStartDate).isAfter(util.utcTime(group.flightEndDate)))
                errors.push(messageDR.error.endBeforeStart);

            if(group.qty <= 0)
                errors.push(message.error.negQuantity);

            if(group.aparPrice < 0 || group.asarPrice < 0)
                errors.push(message.error.negPrice);

            if(group.aparPrice == 0 && group.asarPrice == 0)
                errors.push(message.error.zeroPrice);

            if((group.aparPrice + group.asarPrice) * group.qty > exports.availableBudget)
                errors.push(message.error.overBudget(exports.availableBudget, group));

            return errors;
        };

        var getData = exports.getData = function() {
            exports.model.mp = { id: MX.session.creds.user.mp.id };

            if(exports.model.buyOrders)
                exports.model.buyOrders.forEach(order =>
                    order.mp = exports.model.mp);

            if(exports.model.matches)
                exports.model.matches.forEach(match => {
                    match.buy.mp = exports.model.mp;
                    match.sell.mp = match.sell.catRec.mp = { id: match.sell.mp.id };
                });

            //acquire immediately accessable info
            exports.model.aparPrice = parseFloat($("#aparPrice").val());
            exports.model.asarPrice = parseFloat($("#asarPrice").val());
            exports.model.qty = parseInt($("#qty").val());
            exports.model.status = "Unsubmitted";
            exports.model.marketId = marketsDropdown.selected.val;

            //collect selected attributes
            var attrs = aparSelector.getData().concat(asarSelector.getData());
            exports.model.selectedAttrs = { attributes: attrs };

            //get dates
            exports.model.flightStartDate = dateRangeControl.getStart();
            exports.model.flightEndDate = dateRangeControl.getEnd();

            return exports.model;
        };

        return exports;
    };
});
