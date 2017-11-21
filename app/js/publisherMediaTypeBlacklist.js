define(["app/util", "app/renderer", "app/dal", "app/repo/attr", "app/table"],
function(util, Renderer, dal, AttrRepo, Table) {
    return function(container, team, publishers) {

        var exports = {
            container: container,
            team: team,
            publishers: publishers,
            model: {},
            mediaTypes: []
        };

        exports.init = async function() {
            const mediaP = AttrRepo.get({ typeName: "MediaType" });
            const blacklistP = dal.get(`team/${exports.team.id}/publisherMediaTypeBlacklist`);

            const [media, blacklist] = await Promise.all([mediaP, blacklistP]);
            exports.model = blacklist;
            exports.mediaTypes = media;

            //start building the columns object for the table
            var columns = [
                {
                    name: "Publisher",
                    type: "string",
                    accessor: function(pub) { return pub.value; }
                }
            ];

            //auxillary function
            var alphabeticalComparator = function(a, b) {
                if(a.value.toLowerCase() < b.value.toLowerCase())
                    return -1;
                if(a.value.toLowerCase() == b.value.toLowerCase())
                    return 0;
                return 1;
            };

            //sort the media types then make a checkbox column for each
            exports.mediaTypes.sort(alphabeticalComparator)
                .forEach(type =>
                    columns.push({
                        name: type.value,
                        type: "checkbox",
                        accessor: pub => {} //intentionally do nothing
                    }));

            //construct the table
            exports.table = new Table(exports.container, exports.publishers, columns, false);
        };

        var rowFunc = function(html, handledPub) {
            //blank array to hold the checkboxes
            var cbs = [];
            //find and add them (checkbox columns start at index 1)
            for(var i = 1; i < html.length; i++)
                cbs.push(html.slice(i, i + 1));

            //auxillary functions
            var addRestriction = function(type) {
                exports.model.publisherMediaTypePairs.push({
                    mediaType: type,
                    publisher: handledPub
                });
            };
            var removeRestriction = function(type) {
                exports.model.publisherMediaTypePairs = exports.model.publisherMediaTypePairs.filter(function(pair) {
                    return pair.mediaType.id != type.id || pair.publisher.id != handledPub.id;
                });
            };
            var isAlreadyRestricted = function(type) {
                return exports.model.publisherMediaTypePairs.some(function(pair) {
                    return pair.mediaType.id == type.id && pair.publisher.id == handledPub.id;
                });
            };
            //initialize the checkboxes and register handlers
            cbs.forEach(function(cb, i, arr) {
                $(cb).find("input").prop("checked", isAlreadyRestricted(exports.mediaTypes[i]));
                cb.change(function() {
                    if(cb.find("input").is(":checked"))
                        addRestriction(exports.mediaTypes[i]);
                    else
                        removeRestriction(exports.mediaTypes[i]);
                });
            });
        };

        exports.render = function() {
            return exports.table.render(rowFunc);
        };

        exports.getData = function() {
            return exports.model;
        };

        exports.save = function() {
            return dal.put(`team/${team.id}/publisherMediaTypeBlacklist`, exports.model);
        };

        return exports;
    };
});
