define(["jquery", "app/util", "app/renderer", "app/dropdown", "app/dal", "app/session", "moment",
    "app/orderGroup", "app/viewManager", "app/hub", "app/repo/campaign", "app/permissionEvaluator",
    "app/router", "app/repo/team", "app/noty", "app/list", "app/pageControl", "app/orderGroupRow", "app/dialog"],
function($, util, Renderer, Dropdown, dal, Session, moment, OrderGroup, ViewManager,
hub, CampaignRepo, permEval, Router, TeamRepo, Noty, List, PageControl, OrderGroupRow, Dialog) {
    var MAX_BUDGET = 99999999999.99;
    var dateFormat = "YYYY-MM-DD";

    return class Campaign {
        constructor(campaign, campaigns, mpId, container) {
            this.model = campaign;
            this.campagins = campaigns;
            this.mpId = mpId;
            this.container = container;
            this.originalStart = moment(campaign.flightStartDate);
            this.originalEnd = moment(campaign.flightEndDate);
            this.renderer = new Renderer(container);
            this.isNew = !this.model.id;
            this.promises = {};
            this.elements = {};

            this.isAdmin = permEval.hasPermission(MX.session.creds.user, "ROLE_MP_ADMIN");
            this.allowedToEdit = this.isAdmin
                        || permEval.hasPermission(MX.session.creds.user, "ROLE_TEAM_ADMIN")
                        || permEval.hasPermission(MX.session.creds.user, "ROLE_BUYER")
                        || permEval.hasPermission(MX.session.creds.user, "ROLE_PLANNER");

            this.strings = {};

            this.strings.campSaved = MX.strings.get("camp_saved");
            this.strings.campActivated = MX.strings.get("camp_activated");
            this.strings.campDeactivated = MX.strings.get("camp_deactivated");
            this.strings.dropdownTeamsText = MX.strings.get("camp_dropdownTeamsText");
            this.strings.noStartMsg = MX.strings.get("dateRange_error_emptyStart");
            this.strings.noEndMsg = MX.strings.get("dateRange_error_emptyEnd");
            this.strings.emptyAdvMsg = MX.strings.get("camp_error_emptyAdvertiser");
            this.strings.emptyBrandMsg = MX.strings.get("camp_error_emptyBrand");
            this.strings.emptyBudgetMsg = MX.strings.get("camp_error_emptyBudget");
            this.strings.emptyFeeMsg = MX.strings.get("camp_error_emptyAgencyFee");
            this.strings.emptyNameMsg = MX.strings.get("camp_error_emptyName");
            this.strings.noTeamMsg = MX.strings.get("camp_error_noTeam");
            this.strings.startBeforeTodayMsg = MX.strings.get("dateRange_error_startBeforeToday");
            this.strings.endBeforeStartMsg = MX.strings.get("dateRange_error_endBeforeStart");
            this.strings.negFeeMsg = MX.strings.get("camp_error_negAgencyFee");
            this.strings.highFeeMsg = MX.strings.get("camp_error_highAgencyFee");
            this.strings.negBudgetMsg = MX.strings.get("camp_error_negBudget");
            this.strings.highBudgetMsg = MX.strings.get("camp_error_highBudget");
            this.strings.nameConflictMsg = MX.strings.get("camp_error_nameConflict");

            this.strings.viewText = MX.strings.get("camp_btnView");
            this.strings.ordersCanceled = MX.strings.get("camp_ordersCanceled");
            this.strings.someNotSubmitted = MX.strings.get("camp_error_someOrdersNotSubmitted");
            this.strings.submitSuccess = MX.strings.get("camp_submitSuccess");

            this.strings.cancelConfirm = MX.strings.get("camp_cancelConfirm");

            if(!this.model.status)
                this.model.status = "Active";

            this.currentUser = MX.session.creds.user;
        }

        init() {
            this.promises.teams = dal.get("team", {fetchCampaigns: true}).then((teams) => {
                this.owningTeam = teams.filter(team =>
                    team.campaigns.some(util.idEqTo(this.model))
                )[0];

                return teams;
            });

            return this.promises.teams;
        }

        setRenderer(rend) {
            this.renderer = rend;
        }

        getSelected(list) {
            if(!list || !list.children.length)
                return [];

            return list.children.map(({ model }) => model).filter(model => {
                var targetDom = $(`#${model.id}`);
                return targetDom.length > 0 ? targetDom[0].checked : false;
            });
        }

        orderGroupRowConstructor(html, order) {
            return new OrderGroupRow(html, order, {
                showStatus: true,
                rowFunc: (el, order) => {
                    //set fucnton for checkbox
                    el.find("input[type=checkbox]").change(() => {
                        this.elements.cancelButton.prop("disabled",
                            this.getSelected(this.list).length == 0);

                        this.elements.submitButton.prop("disabled",
                            this.getSelected(this.list).length == 0 ||
                            this.getSelected(this.list).some(group => group.status == "Submitted"));
                    });

                    if(!(order.status == "Unsubmitted" || order.status == "Submitted"))
                        el.find("input[type=checkbox]").prop("disabled", true);

                    if(order.status == "Cancelled" || order.status == "Unsubmitted")
                        html.find(".editContainer")
                            .removeClass("hidden")
                            .click(() => {
                                Router.navigate(`campaigns/${this.model.id}/orderGroup/${order.id}`, false);

                                var control = new OrderGroup(order, this.model);
                                control.setRenderer(ViewManager);
                                control.render();
                            });

                    if(order.status == "Cancelled")
                        html.find(".editContainer input").val(this.strings.viewText);
                }
            });
        }

        renderOrderGroups() {
            this.list = new List({
                container: this.elements.orderGroupTable,
                constructor: this.orderGroupRowConstructor.bind(this)
            });

            this.model.orderGroups = this.model.orderGroups.sort(
                util.mapCompare(
                    ({ created }) => moment.utc(created),
                    (a, b) => b.diff(a)));

            this.pager = new PageControl({
                source: new PageControl.Frontend({
                    items: this.model.orderGroups,
                    pageSize: 3
                }),
                container: this.elements.pageNav,
                list: this.list
            });

            return this.pager.render();
        }

        async cancelOrderGroups() {
            var selected = this.getSelected(this.list);

            await Promise.all(
                selected.map(async group => {
                    await dal.put(`orderGroup/${group.id}/status`, "Cancelled");
                    this.model.orderGroups
                        .filter(item =>
                            item.id == group.id)
                        .forEach(item =>
                            item.status = "Cancelled");
                }));

            Noty.success(this.strings.ordersCanceled);

            //Rerender order groups
            this.renderOrderGroups();
        }

        async submitGroup(group) {
            group.mp = {
                id: group.mp.id
            };

            const submitted = await dal.post(`market/${group.marketId}/orders/group/${group.id}`);
            this.model.orderGroups
                .filter(item =>
                    item.id == submitted.id)
                .forEach(item =>
                    item.status = "Submitted");
        }

        async submitOrderGroups() {
            var selected = this.getSelected(this.list);

            var ids = [];
            var extraMsg = "";

            await Promise.all(selected.map(group => {
                if(group.status == "Unsubmitted") {
                    ids.push(`#${group.id}`);
                    return this.submitGroup(group);
                }

                extraMsg = this.strings.someNotSubmitted;
            }));

            $(ids.join(", ")).remove();
            Noty.success(`${this.strings.submitSuccess}, ${extraMsg}`);

            //Rerender order groups
            this.renderOrderGroups();
        }

        createOrderGroup() {
            Router.navigate(`campaigns/${this.model.id}/orderGroup/new`, true);
        }

        updateActivation(event) {
            var camp = this.getData();

            var errors =  this.validate(camp);
            if(errors.length > 0) {
                util.displayErrors(errors);
                return true;
            }

            event.preventDefault();
            if(camp.status == "Inactive") {
                const anyGroupsToCancel = this.model.orderGroups.some(group =>
                    !["Submitted", "Expired"]
                        .includes(group.status));

                if(!anyGroupsToCancel)
                    return this.setStatus(false);

                return new Dialog({
                    content: this.strings.cancelConfirm,
                    name: "statusDialog",
                    onSubmit: this.setStatus.bind(this, false)
                }).activate();
            }

            return this.setStatus(true);
        }

        async setStatus(isActive) {
            this.elements.activationToggle.prop("checked", isActive);

            await dal.put(`campaign/${this.model.id}/status`, this.model.status);
            Noty.success(isActive
                ? this.strings.campActivated
                : this.strings.campDeactivated);

            return this.render();
        }

        toggleEditing(enable = true) {
            var enableNew = enable && !this.isNew;
            var submitCancel = enableNew && this.model.orderGroups.length > 0;
            var selectedList = this.getSelected(this.list);
            var cancelButton = submitCancel && selectedList.length > 0;
            var subButton = cancelButton && selectedList.none(group => group.status == "Submitted");

            util.toggleButton(this.elements.createOGButton, enableNew && this.model.status == "Active", true);
            util.toggleButton(this.elements.cancelButton, submitCancel, true);
            util.toggleButton(this.elements.submitButton, submitCancel, true);
            util.toggleButton(this.elements.saveButton, enable, true);
            util.toggleElement(this.elements.budgetInput, enable);

            if(enableNew)
                $("#toggleContainer").removeClass("hidden");
            else
                $("#status").removeClass("hidden");

            if(!enable)
                return;

            this.elements.saveButton.click(
                this.save.bind(this));

            this.elements.budgetInput.off("blur").blur(function() {
                this.value = util.roundPrice(this.value, MAX_BUDGET);
            });

            if(!enableNew)
                return;

            this.elements.activationToggle.click(
                this.updateActivation.bind(this));

            this.elements.createOGButton.click(
                this.createOrderGroup.bind(this));

            if(!submitCancel)
                return;

            util.toggleButton(this.elements.cancelButton, cancelButton, false);
            util.toggleButton(this.elements.submitButton, subButton, false);

            this.elements.submitButton.click(
                this.submitOrderGroups.bind(this));

            this.elements.cancelButton.click(
                this.cancelOrderGroups.bind(this));
        }

        onCreate() {
            Router.navigate(`campaigns/${this.model.id}`, true);
            this.isNew = false;
            this.elements.saveButton.val("SAVE");
            this.checkEditability();
        }

        onSave() {
            Noty.success(this.strings.campSaved);
        }

        async save() {
            Noty.closeAll();
            const camp = this.getData();
            const errors = this.validate(camp);

            if(errors.length > 0) {
                util.displayErrors(errors);
                return;
            }

            if(this.owningTeam && this.owningTeam.id) {
                const team = await TeamRepo.getOne(this.owningTeam.id);
                await (camp.id
                    ? dal.put(`campaign/${camp.id}`, camp).then(() => camp.id)
                    : dal.post("campaign", camp).then(resp =>
                        this.model = resp));

                await dal.put(`team/${team.id}/campaign/${this.model.id}`);
            } else
                await CampaignRepo.save(camp);

            if(this.isNew)
                this.onCreate();

            this.onSave();
        }

        checkEditability() {
            if(this.owningTeam)
                this.allowedToEdit = this.isAdmin ||
                    (this.allowedToEdit &&
                    this.owningTeam.members.some(mem => util.idEq(mem, this.currentUser)));

            this.toggleEditing(this.allowedToEdit);
        }

        async render() {
            if(!this.isNew) {
                this.model.flightStartDate = moment(this.model.flightStartDate).format(dateFormat);
                this.model.flightEndDate = moment(this.model.flightEndDate).format(dateFormat);
            }

            await this.renderer.renderTemplate("campaign", this.model);

            this.elements.saveButton = $("#saveButton");
            this.elements.activationToggle = $("#campToggle");
            this.elements.createOGButton = $("#createOG");
            this.elements.cancelButton = $("#cancel");
            this.elements.submitButton = $("#submit");
            this.elements.nameInput = $("#nameInput");
            this.elements.advInput = $("#advInput");
            this.elements.brandInput = $("#brandInput");
            this.elements.budgetInput = $("#budgetInput");
            this.elements.agencyFeeInput = $("#agencyFeeInput");
            this.elements.flightStartInput = $("#flightStartInput");
            this.elements.flightEndInput = $("#flightEndInput");
            this.elements.teamDD = $("#userTeams");
            this.elements.orderGroupTable = $("#orderGroups");
            this.elements.pageNav = $("#pageNav");

            this.elements.agencyFeeInput.blur(function() {
                var input = $(this);
                input.val(util.parseAndCap(input.val(), 100));
            });

            if(!this.isNew && this.model.orderGroups.length > 0)
                this.renderOrderGroups();

            this.checkEditability();

            const teams = await this.promises.teams;
            this.teamDD = new Dropdown(teams, {
                container: this.elements.teamDD,
                promptText: this.strings.dropdownTeamsText,
                textField: "name"
            });

            this.teamDD.change.subscribe(({ item }) =>
                this.owningTeam = item);

            await this.teamDD.render();
            if(this.owningTeam && this.owningTeam.id)
                this.teamDD.selectByVal(this.owningTeam.id);
        }

        validate(camp) {
            var errors = [];
            var fieldMissing = false;

            if(camp.flightStartDate._d == "Invalid Date")
                fieldMissing = util.pushError(this.strings.noStartMsg, errors);

            if(camp.flightEndDate._d == "Invalid Date")
                fieldMissing = util.pushError(this.strings.noEndMsg, errors);

            //Check advertiser value
            if(!camp.advertiser || camp.advertiser == "")
                fieldMissing = util.pushError(this.strings.emptyAdvMsg, errors);

            //Check brand value
            if(!camp.brand || camp.brand == "")
                fieldMissing = util.pushError(this.strings.emptyBrandMsg, errors);

            //Check budget value
            if(!camp.budget)
                fieldMissing = util.pushError(this.strings.emptyBudgetMsg, errors);

            //Check Agency fee
            if(!camp.agencyFee)
                fieldMissing = util.pushError(this.strings.emptyFeeMsg, errors);

            //Check campaign name
            if(!camp.name || camp.name == "")
                fieldMissing = util.pushError(this.strings.emptyNameMsg, errors);

            //Check campaign's team
            if(!this.owningTeam)
                fieldMissing = util.pushError(this.strings.noTeamMsg, errors);

            if(fieldMissing)
                return errors;

            if(camp.budget < 0)
                errors.push(this.strings.emptyBudgetMsg);

            //Only check dates if dates were changed so user can edit other fields without error being thrown
            if(this.originalStart.startOf("day").diff(camp.flightStartDate.startOf("day")) != 0) {
                var today = moment().startOf("day");
                if(camp.flightStartDate.diff(today, "days") < 0)
                    errors.push(this.strings.startBeforeTodayMsg);
                if(camp.flightEndDate.diff(camp.flightStartDate, "days") < 0)
                    errors.push(this.strings.endBeforeStartMsg);
            }

            if(camp.agencyFee < 0)
                errors.push(this.strings.negFeeMsg);
            if(camp.agencyFee > 1)
                errors.push(this.strings.highFeeMsg);

            if(camp.budget <= 0)
                errors.push(this.strings.negBudgetMsg);
            if(camp.budget > MAX_BUDGET) //Max of DOUBLE(10,2) in MySql
                errors.push(this.strings.highBudgetMsg);

            //Make sure campaign's name is unique for this mp
            if(this.campaigns && this.campaigns.filter(function(obj) { return obj.name == camp.name && obj.id != this.model.id; }).length > 0)
                errors.push(this.strings.nameConflictMsg);

            return errors;
        }

        getData() {
            this.model.mp = { id: this.currentUser.mp.id };

            this.model.name = this.elements.nameInput.val();
            this.model.status = this.elements.activationToggle.prop("checked") ? "Active" : "Inactive";
            this.model.advertiser = this.elements.advInput.val();
            this.model.brand = this.elements.brandInput.val();
            this.model.budget = parseFloat(this.elements.budgetInput.val());
            this.model.agencyFee = parseFloat(this.elements.agencyFeeInput.val() / 100);

            this.model.flightStartDate = moment(this.elements.flightStartInput.val());
            this.model.flightEndDate = moment(this.elements.flightEndInput.val());

            return this.model;
        }
    };
});
