define(["app/util", "app/renderer", "app/dal", "app/dropdown", "app/list", "app/catalogGroup",
"app/collapsedSell", "moment-timezone", "app/noty", "app/util/render", "app/tooltip", "app/dialog"],
function(util, Renderer, dal, Dropdown, List, CatalogGroup, CollapsedSellList, moment, Noty,
renderUtil, Tooltip, Dialog) {
    return class SellDialog extends Dialog {
        constructor(records) {
            super({
                name: "sellDialog",
                initialModel: records
            });

            this.addResources(() => ({
                markets: dal.get("market"),
                marketStatus:  dal.get("market/status")
            }));
        }
        getAndConfigureAvailable(market) {
            return async (row, { id, start, end }) => {
                const { value: impAmount } = await dal.get(
                    `market/${market.id}/availableAmounts`, {
                        collapsedId: id,
                        start, end
                    });

                row.find(".impressionInput input")
                    .prop({
                        max: impAmount
                    }).val(impAmount);

                if(impAmount == 0) {
                    row.find("input")
                        .prop("disabled", true)
                        .addClass("disabled");

                    Tooltip.add(row.parent(), this.message.recordUnavailable, {
                        position: "right",
                        hideOnClick: false
                    });
                }
            };
        }
        makeGroupConstructor(market) {
            return (html, group) => {
                const configureAvailable = this.getAndConfigureAvailable(market);

                const groupControl = new CatalogGroup({
                    container: html,
                    model: group,
                    subControlConstructor: CollapsedSellList,
                    rowFunc: configureAvailable
                });

                return groupControl;
            };
        }
        initSelectedMarketInfo(records, market, container) {
            const sellContainer = $("#sellFinalizerDiv", container);

            this.children.sellGroupList = new List({
                container: sellContainer,
                items: records.sort(util.comparator.group),
                constructor: this.makeGroupConstructor(market)
            });
            return this.children.sellGroupList.render();
        }
        validate(sellGroups) {
            const errors = [];

            if(sellGroups.length == 0)
                errors.push("Cannot sell nothing!");

            const unitsLessThanDays = sellGroups.reduce((hasErr, group) =>
                hasErr || group.collapsedDTOs.some(({ quantity, collapsed: { startDate, endDate } }) => {
                    const dayLen = moment(endDate)
                        .diff(moment(startDate), "days") + 1;

                    return dayLen > quantity;
                }), false);

            if(unitsLessThanDays)
                errors.push(this.message.unitsLessThanDays);

            const zeroPrices = sellGroups.reduce((hasErr, group) =>
                hasErr || group.collapsedDTOs.some(dto =>
                    dto.aparPrice == 0 && dto.asarPrice == 0
                ), false);

            if(zeroPrices)
                errors.push(this.message.zeroPrices);

            return errors;
        }
        filterModel(model) {
            return model.map(({ key, value }) => ({
                group: { id: key.id },
                collapsedDTOs:  value
                   .filter(dto => dto.quantity > 0)
            })).filter(sellGroup =>
                sellGroup.collapsedDTOs.length > 0);

        }
        getData() {
            return this.children.sellGroupList.children.map(groupControl => ({
                group: { id: groupControl.model.key.id },
                collapsedDTOs:  groupControl.getData()
                   .filter(dto => dto.quantity > 0)
            })).filter(sellGroup =>
                sellGroup.collapsedDTOs.length > 0);
        }
        async onSubmit() {
            if(this.elements.btnSubmit.hasClass("disabled"))
                return Promise.reject();

            Noty.closeAll();

            const sellGroups = this.getData();
            const errors = this.validate(sellGroups);

            if(errors.length > 0) {
                util.displayErrors(errors);

                return Promise.reject();
            }

            const { val: marketId } = await this.children.marketsDropdown.getModel();

            await dal.post(
                `market/${marketId}/orders/sellGroups`,
                sellGroups);

            $("#dialogMsg").empty();
            Noty.success(this.message.ordersSubmitted);
        }
        async contentRender(viewModel, container) {
            const contentContainer = await new Renderer(container).render("sellDialog");

            if(!this.state.context.resources.marketStatus.open)
                this.elements.msgDiv.empty()
                    .text(MX.message.marketClosed);

            this.children.marketsDropdown = new Dropdown(this.state.context.resources.markets, {
                container: $("#marketsDropdownDiv", contentContainer.parent()),
                promptText: this.message.marketsDropdown,
                textField: "name",
                valField: "id",
                enableDefault: false
            });

            const marketInitP = new Promise((resolve, reject) =>
                this.children.marketsDropdown.change.subscribe(({ item: market }) =>
                    this.initSelectedMarketInfo(
                        viewModel, market, contentContainer.parent()
                    //this is needed to work around the poor sellDialog structure
                    //TODO: extract everything but marketDropdown into its own control
                    ).then(resolve).catch(reject)));

            await this.children.marketsDropdown.render();
            this.children.marketsDropdown.selectByVal(1);
            await marketInitP;

            if(this.getData().length == 0)
                //disable submit if nothing can be sold
                Tooltip.add(
                    this.elements.btnSubmit
                        .addClass("disabled"),
                    this.message.submitDisabled, {
                        hideOnClick: false
                    });
        }
    };
});
