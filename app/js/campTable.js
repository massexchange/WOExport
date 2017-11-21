define(["app/util", "app/renderer", "moment", "app/table"],
function(util, Renderer, moment, Table) {
	return function(container, campaigns, rowFunc) {

		var exports = {
			container: container,
			model: campaigns,
			rowFunc: rowFunc
		};

		var columns = [
			{
				name: "Name",
				accessor: (campaign) => { return campaign.name; },
				type: "string"
			},
			{
				name: "Status",
				accessor: (campaign) => { return campaign.status; },
				type: "string"
			},
			{
				name: "Advertiser",
				accessor: (campaign) => { return campaign.advertiser; },
				type: "string"
			},
			{
				name: "Brand",
				accessor: (campaign) => { return campaign.brand; },
				type: "string"
			},
			{
				name: "Budget",
				accessor: (campaign) => { return campaign.budget.toFixed(2); },
				type: "price"
			},
			{
				name: "Agency Fee",
				accessor: (campaign) => { return (campaign.agencyFee * 100) + "%"; },
				type: "string"
			},
			{
				name: "Flight Start Date",
				accessor: (campaign) => { return campaign.flightStartDate; },
				type: "date"
			},
			{
				name: "Flight End Date",
				accessor: (campaign) => { return campaign.flightEndDate; },
				type: "date"
			}
		];

		exports.table = new Table(exports.container, exports.model, columns, true);
		var render = exports.render = () => exports.table.render(exports.rowFunc);


		var addCampaign = exports.addCampaign = function(campaign) {
			exports.model.push(campaign);
			return render();
		};


		return exports;
	};
});
