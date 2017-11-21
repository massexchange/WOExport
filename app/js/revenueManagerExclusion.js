define(["app/renderer", "app/util", "app/exclusionControl", "app/repo/unitType"], 
function(Renderer, util, ExclusionControl, UnitTypeRepo) {
    return function(container, rme) {    
        var exports = {
            model: rme
        };

        var internals = {
            //this is a list of objects, each of which is a pair of the waterfall control
            //and its associated waterfall control 'entity'
            ecList: [] 
        };

        var render = exports.render = function() {
            var renderer = new Renderer(container);
            renderer.renderView("revenueManagerExclusion").then(function(body) {
                exports.body = body;
                buildControls(exports.model);
            });
        };

        var createElement = function(element) {
            var ecContainer = $("<div>").attr({class: "wrapper"}).appendTo(exports.body);
            var ec = new ExclusionControl(ecContainer, element);
            ec.render();
            internals.ecList.push(ec);
        };

        var buildControls = function(rme) {
            if(rme.controls) {
                //iterate through each of the existing controls
                rme.controls = rme.controls.sort((a, b) => util.comparator.alpha(a.type.longName, b.type.longName));
                rme.controls.forEach(createElement);
            } else {
                //get the available unit types, then initialize blank controls for each
                UnitTypeRepo.get().then(function(types) {
                    rme.controls = types.map(function(x) {
                        return {
                            type: x,
                            minAvailable: 0.0
                        };
                    });
                    rme.controls = rme.controls.sort((a, b) => util.comparator.alpha(a.type.longName, b.type.longName));
                    rme.controls.forEach(createElement);
                });
            }
        };

        var reset = exports.reset = function() {
            internals.ecList.forEach(function(ec) { ec.reset(); });
        };

        var getData = exports.getData = function() {
            return {
                id: exports.model.id,
                mp: exports.model.mp,
                controls: internals.ecList.map(function(element) {
                    return element.getData();
                })
            };
        };

        return exports;
    };
});
