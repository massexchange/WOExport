define(["app/util", "app/renderer","app/dal", "app/repo/attr", "app/table"],
function(util, Renderer, dal, AttrRepo, Table) {
    return function(container, team, publishers) {
        const exports = {
            container: container,
            team: team,
            model: {},
            publishers: publishers
        };

        const columns = [
            {
                name: "Publisher",
                type: "string",
                accessor: pub => pub.value
            },
            {
                name: "Restricted",
                type: "checkbox",
                accessor: pub => pub
            }
        ];

        //the rowFunc initializes whether or not the checkbox is checked
        //and supplies handlers for when the checked state changes
        const rowFunc = function(html, handledPub) {
            const addPublisherToBlacklist = function() {
                //backend expects the object literal to look like so
                exports.model.publishers.push({ publisher: handledPub });
            };

            const removePublisherFromBlacklist = function() {
                exports.model.publishers = exports.model.publishers.filter(pub =>
                    pub.publisher.id != handledPub.id);
            };

            const isAlreadyBlacklisted = function() {
                return exports.model.publishers.some(pub =>
                    //yes, pub.publisher.id is necessary
                    pub.publisher.id == handledPub.id);
            };

            //only one checkbox per row
            const checkbox = html.find(`#${handledPub.id}`);
            //initialize
            $(checkbox).prop("checked",
                isAlreadyBlacklisted());
            //set handler
            checkbox.change(function() {
                if(checkbox[0].checked)
                    addPublisherToBlacklist();
                else
                    removePublisherFromBlacklist();
            });
        };

        exports.init = async function() {
            //TODO: who did this???
            const attrP = AttrRepo.get({ typeName: "Publisher" });

            const blacklist = await dal.get(`team/${exports.team.id}/publisherBlacklist`);
            exports.model = blacklist;
            exports.table = new Table(exports.container, exports.publishers, columns, false);
        };

        exports.render = function() {
            return exports.table.render(rowFunc);
        };

        exports.getData = function() {
            return exports.model;
        };

        exports.save = function() {
            return dal.put(`team/${exports.team.id}/publisherBlacklist`, exports.model);
        };

        return exports;
    };
});
