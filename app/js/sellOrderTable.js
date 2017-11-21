define(["app/renderer", "app/util", "moment", "app/table"],
function(Renderer, util, moment, Table) {
	return function(container, record, rowFunc, options) {
		var exports = {
			model: record,
			container: container,
			rowFunc: rowFunc,
			options: options
		};

		var hasPricing = function(record) {
			return !!record.pricing;
		};

		var computeAverageApar = function(record) {
			stats = { total: 0, count: 0};
			var apar = util.selectAparPrice(
					record.inventory.flightDate,
					record.pricing.aparComponentPriceList);

			stats.total += apar * record.inventory.quantity;
			stats.count += record.inventory.quantity;

			return (stats.total / stats.count);
		};

		var columns = [
			{
				name: "Flight Date",
				accessor: function(record) {
					return record.inventory.flightDate;
				},
				type: "date"
			},
			{
				name: "Units",
				accessor: function(record) { return record.inventory.quantity; },
				type: "number"
			},
			{
				name: "Average Placement Price (USD)",
				accessor: function(record) {
					if(!hasPricing(record))
						return null;

					var aparPrice = computeAverageApar(record);
					return aparPrice.toFixed(2);
				},
				type: "price"
			},
			{
				name: "Average Audience Price (USD)",
				accessor: function(record) {
					if(!hasPricing(record))
						return null;

					var asarPrice = record.pricing.asarComponentPrice;
					return asarPrice.toFixed(2);
				},
				type: "price"
			},
			{
				name: "Select",
				accessor: function(record) { return record; },
				type: "checkbox"
			}
		];

		if(exports.options && exports.options.length > 0)
			columns = columns.concat(exports.options);

		exports.table = new Table(exports.container, exports.model, columns);

		var init = function() {
			exports.table = new Table(exports.container, exports.model, columns);
			exports.table.model = exports.model;
		};

		var render = exports.render = function() {
			return exports.table.render(exports.rowFunc);
		};

		init();
		return exports;
	};
});
