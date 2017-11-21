define(["jquery", "app/dal", "app/renderer", "app/util", "app/util/render"],
function($, dal, Renderer, util, renderUtil) {
    class BackendSource {
        constructor({ endpoint, method, ...params }) {
            this.endpoint = endpoint;
            this.method = method;

            this.params = params;
        }
        query({ pageIndex }) {
            return dal[this.method](this.endpoint, {
                pageIndex,
                ...this.params
            });
        }
    }

    class FrontendSource {
        constructor({ items, pageSize }) {
            this.items = items;
            this.pageSize = pageSize;

            this.numPages = Math.ceil(items.length / pageSize);
        }
        query({ pageIndex }) {
            const pageStart = pageIndex * this.pageSize;

            return Promise.resolve({
                last: pageIndex == this.numPages - 1,
                first: pageIndex == 0,
                number: pageIndex,
                content: this.items.slice(
                    pageStart, pageStart + this.pageSize),
                totalPages: this.numPages
            });
        }
    }

    class PageControl {
        constructor({ list, container, source, ...options }) {
            this.list = list;
            this.renderer = new Renderer(container);
            this.source = source;

            this.options = {
                onRenderCallback: util.noop,
                postProcessing: x => x,
                additionalQueries: [],
                ...options
            };

            this.promises = {};
        }
        async render() {
            this.state = {};

            await this.renderer.renderView("pageControl");
            this.elements = renderUtil.selectElements({
                nextButton: "#next",
                prevButton: "#prev",
                pageNumField: "#pageNum",
                pageNumContainer: "#pageNumContainer",
                listContainer: "#listContainer",
                maxPages: "#maxPages"
            }, this.container);

            this.registerHandlers();

            //TODO: move this shit?
            const { pageNumField, nextButton, pageNumContainer, maxPages, listContainer }
                = this.elements;

            pageNumField.val(this.state.currentPage + 1);

            this.list.container = listContainer;

            await this.getNthPage(0);
            maxPages.text(this.source.numPages);
            pageNumField.prop("max", this.source.numPages);

            if(this.source.numPages > 1) {
                pageNumContainer.removeClass("hidden");
                nextButton.removeClass("hidden");
                pageNumField.removeClass("hidden");
            }
        }
        registerHandlers() {
            const { pageNumField, prevButton, nextButton } = this.elements;

            prevButton.click(
                this.getPrevious.bind(this));
            nextButton.click(
                this.getNext.bind(this));

            pageNumField.bind("keypress", e => {
                //figure out which key was pressed
                const code = e.keyCode || e.which;

                //if it was the enter key
                if(code == 13) {
                    var pageNum = parseInt(pageNumField.val() - 1);
                    if(pageNum > this.source.numPages) {
                        pageNumField.val(this.source.numPages);
                        pageNum = this.source.numPages - 1;
                    }

                    this.getNthPage(pageNum);
                }
            });
        }
        set requestParams(params) {
            this.source.params = params;
        }
        get currentPage() {
            return this.state.currentPage;
        }
        async query(pageIndex) {
            const additionalQuerysP = util.collectQueries(
                this.options.additionalQueries
            ).then(additionalParams =>
                this.list.params = additionalParams);

            const queryP = this.source.query({ pageIndex });

            await additionalQuerysP;
            const page = await queryP;

            this.state.numPages = page.totalPages;

            return page;
        }
        getNthPage(pageNumber) {
            if(pageNumber == this.state.currentPage ||
                pageNumber >= this.source.numPages ||
                pageNumber < 0
            )
                return Promise.resolve();

            this.state.currentPage = pageNumber;

            return renderUtil.spinAction(this.elements.listContainer,
                async () =>  {
                    const page = await this.query(pageNumber);
                    this.updateControls(page);

                    this.list.model.next(page.content);

                    await this.list.render();
                    return this.options.onRenderCallback();
                });
        }
        getPrevious() {
            return this.getNthPage(this.state.currentPage - 1);
        }
        getNext() {
            return this.getNthPage(this.state.currentPage + 1);
        }
        updateControls({ number, first, last }) {
            const { pageNumField, prevButton, nextButton } = this.elements;

            //set the page number
            pageNumField.val(number + 1);

            //hide and show buttons as necessary
            prevButton.toggleClass("hidden", first);
            nextButton.toggleClass("hidden", last);
        }
    }

    PageControl.Backend = BackendSource;
    PageControl.Frontend = FrontendSource;

    return PageControl;
});
