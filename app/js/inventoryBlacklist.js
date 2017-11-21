define(["app/util", "app/renderer", "app/dal", "app/table"],
function(util, Renderer, dal, Table) {
    return function(container, team, publishers) {
        var exports = {
            container: container,
            team: team,
            model: {},
            publishers: publishers
        };

        var originalUnitTypes;
        var internals = {};

        //auxillary function
        var sortByPublisher = function(attrDepList) {
            var alphabeticalComparator = (a, b) => {
                if(a.parent.value.toLowerCase() < b.parent.value.toLowerCase())
                    return -1;
                if(a.parent.value.toLowerCase() == b.parent.value.toLowerCase())
                    return 0;
                return 1;
            };

            return attrDepList.sort(alphabeticalComparator);
        };

        exports.init = async function() {
            //get publications for each publisher
            const publPs = exports.publishers.map(pub =>
                dal.get("attr/deps", { parentId: pub.id }));

            const tableRowPs = Promise.all(publPs).then(function() {
                //get the attr deps
                var attrDeps = util.getArgs(arguments);
                //flatten the arrays
                attrDeps = util.flatten(attrDeps);

                //filter out non-publication attrs
                //TODO: FIX FT IMPORT PROCESS SO NON-PUBLICATION ATTRS DON'T DEPEND ON PUBLISHER ATTRS
                attrDeps = attrDeps.filter(dep =>
                    dep.child.type.name == "Publication");

                //sort them alphabetically by publisher
                //these will be the table rows
                internals.pubPublPairs = sortByPublisher(attrDeps);
            });

            //get unit types
            const unitTypeP = dal.get("attr/unitTypes", {}).then(types => {
                originalUnitTypes = types;
                internals.unitTypes = types.sort()
                    .filter(x =>
                        x.name == "LP" ||
                        x.name == "ROS");
            });

            //get publisher-publication-unittype blacklist (thats a name)
            const blacklist = await dal.get(`team/${team.id}/publisherPublicationUnitTypeBlacklist`, {});
            exports.model = blacklist;

            await Promise.all([...tableRowPs, unitTypeP]);
            const columns = [
                {
                    name: "Publisher",
                    type: "string",
                    accessor: dep => dep.parent.value
                },
                {
                    name: "Publication",
                    type: "string",
                    accessor: dep => dep.child.value
                }
            ];

            internals.unitTypes.forEach(({ name }) =>
                columns.push({
                    name: name,
                    type: "checkbox",
                    accessor: util.constant()
                }));

            //initialize table
            exports.table = new Table(exports.container, internals.pubPublPairs, columns, false);
        };

        //rowfunc definition
        //the publisherPublicationUnitTypePair (goddammit thats a name) will
        //look at the attribute dependency's child (publication)
        var rowFunc = function(html, dep) {
            //blank array to hold the checkboxes
            var cbs = [];
            //find and add them (checkbox columns start at index 2)
            for(var i = 2; i < html.length; i++)
                cbs.push(html.slice(i, i+1));

            //auxillary functions
            var addRestriction = function(type) {
                exports.model.publisherPublicationUnitTypePairs.push({
                    publisher: dep.parent,
                    unitType: type,
                    publication: dep.child
                });
            };
            var removeRestriction = function(type) {
                exports.model.publisherPublicationUnitTypePairs = exports.model.publisherPublicationUnitTypePairs.filter(function(pair) {
                    return pair.unitType.name != type.name || pair.publication.id != dep.child.id || pair.publisher.id != dep.parent.id;
                });
            };
            var isAlreadyRestricted = function(type) {
                return exports.model.publisherPublicationUnitTypePairs.some(function(pair) {
                    return pair.unitType.name == type.name && pair.publication.id == dep.child.id && pair.publisher.id == dep.parent.id;
                });
            };
            //initialize the checkboxes and register handlers
            cbs.forEach(function(cb, i, arr) {
                $(cb).find("input").prop('checked', isAlreadyRestricted(internals.unitTypes[i]));
                cb.change(function() {
                    if(cb.find("input").is(':checked'))
                        addRestriction(internals.unitTypes[i]);
                    else
                        removeRestriction(internals.unitTypes[i]);
                });
            });
        };

        var convertUnitType = function(pair) {
            return pair.unitType = pair.unitType.name;
        };

        var render = exports.render = function() {
            return exports.table.render(rowFunc);
        };

        var getData = exports.getData = function() {
            //Make deep copy as to not call convertUnitType on the underlying unit type objects
            var copy = $.extend(true, {}, exports.model);
            copy.publisherPublicationUnitTypePairs.forEach(convertUnitType);
            return copy;
        };

        var save = exports.save = function() {
            return dal.put("team/"+ team.id +"/publisherPublicationUnitTypeBlacklist", getData());
        };

        return exports;
    };
});
