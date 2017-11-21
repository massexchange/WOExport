define(["jquery", "Rx", "app/util", "app/control"], function($, Rx, util, Control) {
    // TODO: these might break if the value contains spaces or is undefined.
    const valSelector = val => `[value=${val}]`;
    const textSelector = text => `:contains(${text})`;

    return class Dropdown extends Control {
        constructor(items, { container, ...options}) {
            super({
                template: "dropdown",
                promptText: "Choose an item", //default option text
                textField: "name",            //item field for display
                valField: "id",               //item field for identification
                enableDefault: false,         //default item selectability
                defaultItemVal: "default",    //default item value
                selectVal: "default",
                disableDropdown: false,       //dropdown usability
                showAll: false,               //show all options
                ...options
            });

            const { textField, valField, selectVal } = this.options;

            this.getItemByVal = this.getBy(valField);
            this.getItemByText = this.getBy(textField);

            this.selectByVal = this.selectBy(valSelector);
            this.selectByText = this.selectBy(textSelector);

            this.removeByVal = this.removeBy(valSelector, valField);
            this.removeByText = this.removeBy(textSelector, textField);

            this.items = items;
            this.options.initialModel = this.makeModel(selectVal);

            //TODO: make a decision on this pattern
            this.model.subscribe(model =>
                this.selected = model);

            this.changes = new Rx.Subject();
            this.change = this.changes.withLatestFrom(this.model, (a, b) => b);

            this.container = container;

            this.transitions.render.addStep(() =>
                this.element = this.container.find("select")
                    .change(this.handleChange));
        }
        viewModelMapping(model) {
            const { textField, valField, showAll, disableDropdown, defaultItemVal, enableDefault, promptText }
                = this.options;

            const selectOptions = this.items.map(item => ({
                text: util.select(item, textField),
                val: util.select(item, valField)
            }));

            return {
                items: selectOptions,
                size: Math.max(selectOptions.length, 2),
                showAll, disableDropdown, defaultItemVal,
                enableDefault, promptText
            };
        }
        makeModel(val) {
            const parsedVal = util.numCoalesce(val);

            return {
                val: parsedVal,
                item: this.getItemByVal(parsedVal)
            };
        }
        handleChange({ target }, triggerChange = true) {
            this.model.next(
                this.makeModel(
                    $(target).val()));

            if(triggerChange)
                this.changes.next();
        }
        getBy(field) {
            return val =>
                this.items.filter(util.compose(
                    util.eqTo(val),
                    util.selectorFor(field)
                ))[0];
        }
        findOption(query) {
            return this.element.find(`option${query}`);
        }
        selectBy(selector) {
            return (x, triggerChange = true) => {
                this.element.val(this.findOption(selector(x)).val());
                return this.handleChange({ target: this.element }, triggerChange);
            };
        }
        removeBy(selector, field) {
            return x => {
                if(!util.isDefined(x))
                    throw new Error("Cannot remove without a value");

                this.findOption(selector(x)).remove();

                //remove it from the items field too
                this.items = this.items
                    .filter(util.pred.not(
                        util.fieldEqTo(field, x)));

                this.reset();
            };
        }
        addItem(item) {
            this.items.push(item);

            this.container.find("select").append(
                $("<option>")
                    .attr("value", item[this.options.valField])
                    .text(item[this.options.textField])
            );
        }
        reset() {
            this.selectByVal(this.options.defaultItemVal, false);

            //TODO: reselect the default? or idk
        }
        unrender() {
            this.container.empty();
        }
    };
});
