define(["jquery", "vex", "app/util", "app/util/render", "app/renderer", "app/control", "app/util/promise",
"css!../lib/js/vex/dist/css/vex.css", "css!../../app/css/vex-theme-mx.css"],
function($, vex, util, renderUtil, Renderer, Control, promiseUtil) {
    /*
        Dialog
        modal dialog control

        there can only be one active dialog  at a time

        Options:
          *
    */
    return class Dialog extends Control {
        constructor({ ...options }) {
            super({
                selectors: {
                    buttons: ".vex-dialog-buttons",
                    btnSubmit: ".vex-dialog-button-primary",
                    btnCancel: ".vex-dialog-button-secondary",
                    msgDiv: ".vex-dialog-message",
                    userContentContainer: ".vex-dialog-input",
                    form: ".vex-dialog-form"
                },
                showButtons: true,
                yesText: "SUBMIT",
                initialModel: {},
                ...options
            });

            const { Active } = this.states;
            const { render } = this.transitions;

            render.addStep(
                this.configureButtons);

            Active.activated
                .subscribe(this.render);
        }
        contentRender(viewModel, container) {
            if(this.options.contentRender)
                return this.options.contentRender(viewModel, container);

            container.append(this.options.content);
            return Promise.resolve();
        }
        /*
            overrides control.renderTemplate to
            delegate rendering to the ViewManager
        */
        async renderTemplate(viewModel) {
            vex.dialog.buttons.YES.text = this.options.yesText;

            this.container = $("<div>");
            const renderer = new Renderer(this.container);

            const formDiv = await renderer.render("dialog");

            this.closeP = promiseUtil.defer();

            this.instance = await new Promise((resolve, reject) =>
                vex.open({
                    message: "",
                    className: "vex-theme-mx",
                    focusFirstInput: false,
                    afterOpen: function() {
                        resolve(this);
                    },
                    afterClose: () => {
                        this.deactivate();
                        this.closeP.resolve();
                    }
                }));

            this.modalContainer = $(".vex-content");

            return viewModel;
        }
        configureButtons(viewModel) {
            const { buttons, btnSubmit, btnCancel } = this.elements;

            return renderUtil.spinAction(this.modalContainer, async () => {
                if(this.options.showButtons) {
                    btnSubmit.click(this.submit);
                    btnCancel.click(this.close);
                } else
                    buttons.hide();

                await this.contentRender(viewModel,
                    this.container.find(".vex-dialog-input"));
                await this.insertContent();
            });
        }
        insertContent() {
            return new Promise(resolve =>
                this.modalContainer
                    .one("transitionend", () => {
                        this.elements.form
                            .addClass("visible");

                        resolve();
                    })
                    .append(this.container)
                    .addClass(this.name));
        }
        close() {
            this.instance.close();

            return this.closeP.promise;
        }
        onSubmit() {
            return (
                this.options.onSubmit ||
                util.constantP())();
        }
        submit() {
            return renderUtil.spinAction(this.modalContainer, async () => {
                await this.onSubmit();
                return this.close();
            });
        }
    };
});
