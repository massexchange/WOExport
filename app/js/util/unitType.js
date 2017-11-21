define(["app/util"], function(util) {
    var utUtil = {};

    utUtil.objectsToUnitTypeToObjectMap = function(objects, accessor) {
        return objects.reduce((acc, curr) => {
            acc[curr[accessor].shortName] = curr;
            return acc;
        }, {});
    };

    return utUtil;
});
