define(["jquery", "app/util", "app/dialog", "app/list", "app/exception", "app/control", "app/dal", "Rx", "app/noty"],
function($, util, Dialog, List, Exception, Control, dal, Rx, Noty) {
    return class StatusControl extends Control {
        constructor(executor) {
            super({
                executor,
                template: "status",
                selectors: {
                    cancelTasks: ".cancelTasks"
                },
                renderUpdates: true
            });

            //observable of status refresh triggers,
            //either from a timer or user action
            this.refreshTriggers = new Rx.Subject();
            //this exists to allow refreshes to be
            //triggered from multiple sources

            //every 5 seconds
            Rx.Observable.timer(0, 5000)
                //trigger a refresh
                .subscribe(this.refreshTriggers);

            this.options.modelSource =
                //on every trigger
                this.refreshTriggers.flatMap(() =>
                    //fetch the new status
                    dal.get(`admin/status/${this.options.executor}`));

            this.transitions.render.addStep(({ exceptions }) => {
                //set up the exception dialog
                if(util.hasElements(exceptions))
                    this.container.find(".exceptions").click(() =>
                        this.showExceptions(exceptions));

                //set up the clear button
                this.elements.cancelTasks.click(
                    this.cancelTasks);
            });
        }
        viewModelMapping(model) {
            model.name = this.options.executor;
            return model;
        }
        refresh() {
            this.refreshTriggers.next();
        }
        async cancelTasks() {
            //delete the pending tasks,
            await dal.delete(`admin/status/${this.options.executor}/jobs`);

            //and then trigger a refresh
            Noty.success(
                this.message.clearedTask(
                    this.options.executor));

            this.refresh();
        }
        showExceptions(exceptions) {
            const dialog = new Dialog({
                className: "exceptionDialog",
                showButtons: false,
                contentRender: (viewModel, container) => {
                    this.children.exceptionList = new List({
                        container: container,
                        items: exceptions,
                        constructor: Exception,
                        containerClass: "exception"
                    });

                    return this.children.exceptionList.render();
                }
            });
            return dialog.activate();
        }
    };
});
