define(["jquery", "app/dal", "app/util", "app/table", "app/dropdown", "app/router", "app/noty"],
function($, dal, util, Table, Dropdown, Router, Noty) {
    const rendFunc = function(market) {
        return function(container, element) {
            container = container.parent();
            container.find(".delete").click(() => {
                market.memberTable.model = market.memberTable.model
                    .filter(datum =>
                        datum.id != element.id);

                market.MPDD.addItem(element);
                container.remove();
            });

            container.find(".delete").prop("disabled",
                market.model.status == "Inactive" ||
                !market.owned
                || element.id == market.myMpId);

            if(market.owned)
                container.find(".delete")
                    .removeClass("hidden");
        };
    };

    return class Market {
        constructor(market) {
            this.model = market;
            this.myMpId = MX.session.creds.user.mp.id;
            this.owned = market.owner.id == this.myMpId;
            this.isNew = this.model.id == 0;

            this.message = MX.strings.store["market"];
        }
        init() {
            this.MPP = dal.get("mp");
            if(!this.isNew) {
                this.marketP = dal.get("market", { mpId: MX.session.creds.user.mp.id });
                return Promise.all([this.MPP, this.marketP]);
            }

            return this.MPP;
        }
        setRenderer(rend) {
            this.renderer = rend;
        }
        async render() {
            await this.renderer.renderTemplate("market", this.model);

            this.memberTable = new Table($("#memberTable"), this.model.members, this.createColumnsObject(), false);
            this.memberTable.render(rendFunc(this));
            this.elements = {};
            this.elements.ownerName = $("#ownerName");
            this.elements.typeName = $("#typeName");
            this.elements.status = $("#status");
            this.elements.deactivateButton = $("#deactivateButton");
            this.elements.saveButton = $("#saveButton");
            this.elements.marketName = $("#marketName");
            this.elements.response = $("#response");
            this.elements.MPDD = $("#MPDD");
            this.elements.MPLabel = $("#MPLabel");
            this.elements.addButton = $("#addButton");

            const isInactive = this.model.status == "Inactive";

            this.elements.deactivateButton
                .click(() =>
                    this.deactivateMarket())
                .prop("disabled",
                    isInactive || !this.owned);

            if(!this.isNew)
                this.elements.deactivateButton.removeClass("hidden");

            this.elements.saveButton
                .click(() => this.owned
                    ? this.saveMarket()
                    : this.leaveMarket())
                .prop("disabled", isInactive);

            if(!this.owned)
                this.elements.saveButton.val(this.message.leave);

            this.elements.marketName.prop("disabled", isInactive);

            if(this.isNew)
                $("#title").html(this.message.newTitle);

            if(this.owned)
                this.initMpDropdown();

            if(!this.isNew)
                this.initMarketDropdown();
        }
        async initMpDropdown() {
            const MPs = await this.MPP;
            const otherMPs = MPs.filter(mp =>
                mp.id != this.myMpId &&
                !this.model.members.some(mem =>
                    mem.id == mp.id));

            const isInactive = this.model.status == "Inactive";

            this.MPDD = new Dropdown(otherMPs, {
                container: this.elements.MPDD,
                promptText: this.message.mpDropdownText,
                textField: "name"
            });

            this.MPDD.change.subscribe(({ item }) =>
                this.addToMarket(item));

            this.elements.addButton
                .click(() => {
                    this.elements.addButton.addClass("hidden");
                    this.elements.MPDD.removeClass("hidden");
                    this.elements.MPLabel.removeClass("hidden");
                }).prop("disabled", isInactive)
                .removeClass("hidden");

            await this.MPDD.render();
            this.elements.MPDD.prop("disabled", isInactive);
        }
        async initMarketDropdown() {
            const markets = await this.marketP;
            const privateMarkets = markets
                .filter(mkt => mkt.id != 1)
                .sort(util.mapCompare(
                    ({ name }) => name,
                    util.comparator.alpha));

            this.marketDD = new Dropdown(privateMarkets, {
                container: $("#marketDD"),
                promptText: this.message.marketDropdownText,
                textField: "name"
            });

            await this.marketDD.render();

            if(this.model.id == 0)
                this.marketDD.addItem(this.model);

            this.marketDD.selectByVal(this.model.id);
            this.marketDD.change.subscribe(async ({ item: market }) => {
                Router.navigate(`marketManagement/${market.id}`, false);

                const control = new Market(market);
                control.setRenderer(this.renderer);
                await control.init();
                control.render();
            });
        }
        createColumnsObject() {
            return [
                {
                    name: "Name",
                    accessor: mem => mem.name,
                    type: "string"
                },
                {
                    name: "Role",
                    accessor: mem => mem.role,
                    type: "string"
                },
                {
                    name: "",
                    accessor: mem => " ",
                    type: "removeButton"
                }
            ];
        }
        //TODO: fix this
        addToMarket(mp) {
            this.memberTable.addItem(mp, rendFunc(this));

            this.MPDD.removeByVal(mp.id);

            this.elements.MPDD.addClass("hidden");
            this.elements.MPLabel.addClass("hidden");
            this.elements.addButton.removeClass("hidden");
        }
        async deactivateMarket() {
            await dal.put(`market/${this.model.id}/status`, "Inactive");
            Noty.success(this.message.deactivated);
            Router.navigate("marketManagement/", true);
        }
        async leaveMarket() {
            await dal.delete(`market/${this.model.id}/members/${this.myMpId}`);
            Router.navigate("marketManagement/", true);
        }
        async saveMarket() {
            Noty.closeAll();
            $("#response").text("");

            this.model.name = this.elements.marketName.val().trim();
            if(this.model.name.length == 0) {
                Noty.error(this.message.nameRequired);
                return;
            }

            this.model.members = this.memberTable.model;
            this.model.type = this.model.type.name || this.model.type;

            const resp = await (this.model.id
                ? dal.put(`market/${this.model.id}`, this.model)
                : dal.post("market", this.model));

            if(this.isNew) {
                Noty.success(this.message.created);
                Router.navigate(`marketManagement/${resp.id}`, true);
            } else {
                this.model = resp;

                Router.navigate(`marketManagement/${this.model.id}`, false);
                this.marketDD.removeByVal(this.model.id);
                this.marketDD.addItem(this.model);
                this.marketDD.selectByVal(this.model.id, false);
            }

            Noty.success(this.message.saved);
        }
    };
});
