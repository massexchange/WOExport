define(["app/util", "app/renderer", "app/list", "app/assetListRow"],
function(util, Renderer, List, AssetListRow) {
    return function(container, model) {
        const exports = {
            container: container,
            model: model
        };

        exports.render = async () => {
            const renderer = new Renderer(exports.container);
            const el = await renderer.renderView("matchSummaryRow");

            //organized by campaign first, so render that first
            const campaignHeaderRenderer = new Renderer(el.parent().find(".campaignInfo"));
            const headerP = campaignHeaderRenderer.renderTemplate("matchSummaryCampaignHeader", exports.model);

            const listContainer = el.parent().find(".assetList");
            const assetList = new List({
                container: listContainer,
                items: exports.model.assetsToMatchingInfoList,
                constructor: AssetListRow
            });

            const assetP =  assetList.render();

            return Promise.all([headerP, assetP]);
        };

        return exports;
    };
});
