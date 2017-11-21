define(["app/spinner"], function(Spinner) {
    return class RenderUtil {
        static createActionSpinner(container) {
            return action =>
                this.spinAction(container, action);
        }
        //wrap long actions with a spinner
        static async spinAction(container, action) {
            await Spinner.add(container);

            try {
                const response = await action();
                return response;
            } finally {
                Spinner.remove(container);
            }
        }
        static selectElements(selectors, container) {
            return Object.entries(selectors)
                .reduce((elements, [name, selector]) => {
                    elements[name] = $(selector, container);
                    return elements;
                }, {});
        }
    };
});
