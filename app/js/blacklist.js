define(["jquery", "app/util", "app/renderer", "app/dal", "app/table", "app/permissionEvaluator"], 
function($, util, Renderer, dal, Table, permEval) {
	return function(container, blacklist, removeButtonCallback) {
		

		var exports = {
			model: blacklist,
			container: container,
			removeButtonCallback: removeButtonCallback
		};

		var columns = [
			{
				name: "Name",
				accessor: function(mp) { return mp.name; },
				type: "string"
			}
		];

		if(permEval.hasPermission(MX.session.creds.user, "ROLE_REVENUE_YIELD"))
		{
			var removeCol = {
				name: "Action",
				accessor: function(mp) { return mp.id; }, //checkbox id is supposed to be mp.id,
				type: "removeButton"
			};
			columns.push(removeCol);
		}

		exports.table = new Table(exports.container, exports.model.listees, columns);
		
		var render = exports.render = function() {
			return exports.table.render(exports.removeButtonCallback)
		}

		var addMember = exports.addMember = function(member) {
			exports.table.addItem(member, exports.removeButtonCallback);
		};

		return exports;
	};
});