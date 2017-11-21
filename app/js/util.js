define(["moment-timezone", "Rx", "app/noty"], function(moment, Rx, Noty) {
    var util = {};

    util.slice = Function.call.bind(Array.prototype.slice);
    util.concat = Function.call.bind(String.prototype.concat);

    util.toLowerCase = Function.call.bind(String.prototype.toLowerCase);

    util.constant = val => () => val;
    util.constantP = val => () => Promise.resolve(val);

    util.bind = thisVal => func =>
        func.bind(thisVal);

    util.range = (a, b) => {
        const out = [];
        for(var i = a; i <= b; i++)
            out.push(i);
        return out;
    };

    util.repeat = (val, times) =>
        util.range(0, times - 1)
            .map(util.constant(val));

    util.pipe = x => x;
    util.pipeP = x => Promise.resolve(x);
    util.pipeTransform = function() {
        var transforms = util.getArgs(arguments);
        return function() {
            return util.getArgs(arguments).map(function(arg, i) {
                return (transforms[i] || util.pipe)(arg);
            });
        };
    };

    util.mapArgs = function(transform) {
        return function() {
            var args = util.getArgs(arguments);

            return util.pipeTransform.apply(this,
                util.repeat(transform, args.length)
            ).apply(this, args);
        };
    };

    util.noop = () => {};

    util.select = function(obj, path) {
        var props = path.split(".");
        var selectInternal = function(obj, props) {
            if (props.length == 1)
                return obj[props[0]];

            return selectInternal(obj[props[0]], props.slice(1));
        };

        return selectInternal(obj, props);
    };
    util.selectFrom = obj => path => util.select(obj, path);
    util.selectorFor = path => obj => util.select(obj, path);
    util.safeSelect = (obj, prop, constructor) => {
        if(!obj.hasOwnProperty(prop))
            obj[prop] = util.isConstructor(constructor)
                ? new constructor(prop)
                : constructor(prop);

        return obj[prop];
    };

    util.getter = function(obj, field) {
        return util.partialLeft(
            util.select,
                obj,
                field
        );
    };

    util.call = function(f, ...args) {
        return f.call(this, ...args);
    };

    util.callField = fieldName => util.compose(
        util.call,
        util.selectorFor(fieldName)
    );

    util.partialRight = function(f, ...partialArgs) {
        return (...args) => {
            return f.apply(this, [...args, ...partialArgs]);
        };
    };

    util.partialLeft = function(f, ...partialArgs) {
        return (...args) => {
            return f.apply(this, [...partialArgs, ...args]);
        };
    };

    util.pred = {};

    util.pred.attrIsInCategory = cat => attr =>
        attr.type.component.name == cat;

    util.pred.not = pred =>
        function(...args) {
            return !pred.apply(this, args);
        };

    util.eq = (a, b) => a === b;
    util.eqTo = a => b => util.eq(a, b);

    util.isNull = util.eqTo(null);
    util.isNotNull = util.pred.not(util.isNull);

    var typeIs = type => obj => typeof obj === type;

    util.isDefined = util.pred.not(typeIs("undefined"));
    util.isObject = typeIs("object");
    util.isString = typeIs("string");
    util.isFunction = typeIs("function");

    //blatantly stolen from npm/is-plain-obj
    //https://www.npmjs.com/package/is-plain-obj
    util.isPlainObj = x => {
        var toString = Object.prototype.toString;
        var prototype;
        return toString.call(x) === "[object Object]" && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
    };

    //super hacky do not trust
    util.isConstructor = f =>
        !!f.prototype &&
        f !== ({}).constructor;

    // heuristic for determining if an object is a jQuery XHR result
    util.isXhr = obj =>
        Array.isArray(obj) &&
            util.isString(obj[1]) && obj[1] === "success" &&
            util.isObject(obj[2]) && obj[2].readyState === 4;

    util.isPromise = obj =>
        typeof obj.then == "function";

    util.isObservable = obj =>
         obj instanceof Rx.Observable;

    util.pipe = arg => arg;
    util.pipeTransform = (...transforms) => (...args) =>
            args.map((arg, i) =>
                (transforms[i] || util.pipe)(arg));

    util.noop = () => {};

    util.wrapIfNeeded = val => !Array.isArray(val) ? [val] : val;
    util.unwrapIfNeeded = val => Array.isArray(val) && val.length == 1 ? val[0] : val;

    /*
        n-function composition with splitting support
        order goes outer->inner, math-style

        ex1: compose(double, addOne)(2) == 6
        ex2: compose(
                 add,
                 [double, addOne],
                 addTwo
             )(3) == 16
    */
    util.compose = (...steps) => {
        steps = steps.reverse().map(util.wrapIfNeeded);
        return function(...initArgs) {
            return util.unwrapIfNeeded(
                steps.reduce((args, step) =>
                    step.map(f => f.apply(this, args)),
                    initArgs)
            );
        };
    };

    util.idSelector = util.selectorFor("id");
    util.idOfSelector = util.compose(
        util.selectorFor,
        field => field.concat(".id")
    );

    util.getter = (obj, field) => () =>
    util.select(obj, field);

    //Runs each function with arguments passed to wrapper
    util.chain = (...funcs) =>
        function(...args) {
            funcs.forEach(f => f.apply(this, args));
            return args;
        };

    /*  Converts a list to a map where the keys and values are the result of applying
        the supplied functions to each element
        Returns: map of keyF(element) -> valF(element)
        Sample usage: toMap([1,2,3], pipe, addOne)
                        -> { "1": 2, "2": 3, "3": 4 }
    */
    util.toMap = (list, keySelector, valSelector = util.pipe, isMultiSet = false) =>
        list.reduce((map, item) => {
            var key = keySelector(item);
            var value = valSelector(item);
            if(isMultiSet) {
                if(!map.hasOwnProperty(key))
                    map[key] = [];

                map[key].push(value);
            }
            else
                map[key] = value;
            return map;
        }, {});

    util.entriesToMap = list =>
        util.toMap(list, ([key]) => key, ([,value]) => value);


    /*  Indexes a list using the supplied key
    Takes: list to be indexed, key to index on
    Returns: map of key -> obj
    Sample usage: indexList([{x:1,y:2},{x:3,y:4},{x:5,y:6},{x:7,y:8}], item => item.y)
                     -> { "2": { x: 1, y: 2 },
                          "4": { x: 3, y: 4 },
                          "6": { x: 5, y: 6 },
                          "8": { x: 7, y: 8 } }
    */
    util.indexList = (list, keySelector, isMultiSet) =>
        util.toMap(list, keySelector, util.pipe, isMultiSet);

    util.mapTo = (list, valSelector) =>
        util.toMap(list, util.pipe, valSelector);

    util.mapArray = obj => util.indexList(obj, (el, i) => el);

    util.memberOf = (list, key) => {
        var keySelector = util.selectorFor(key);
        var hashSet = util.toMap(list, keySelector, util.true);

        return item => !!hashSet[item];
    };

    util.whereEq = (list, field, val) => {
        const selector = util.mapIfNotFunction(
            util.selectorFor)(field);

        return list.filter(x => selector(x) == val);
    };

    util.replaceWhere = (list, field, val, obj) =>
        list.map(x => x[field] == val ? obj : x);

    util.mapVal = (list, val) => list.map(util.constant(val));

    util.flatten = list => Array.prototype.concat.apply([], list);

    util.spread = iterable => [...iterable];

    util.mergeMaps = (...maps) =>
        new Map(
            util.flatten(
                maps.map(
                    util.spread)));

    util.toList = obj => {
        var out = [];
        for(var i in obj)
            out.push(obj[i]);
        return out;
    };

    util.head = list => list[0];
    util.tail = list => list.slice(1);
    util.last = list => list[list.length-1];

    //equals is an equality operator
    util.contains = (list, equals, val) => {
        var contained = false;
        for(var i in list) {
            var el = list[i];
            if(equals(el, val)) {
                contained = true;
                break;
            }
        }
        return contained;
    };

    //returns true if a is a subset of b; op is the equality operator (different for primitives vs objects)
    //precondition: a and b are sets (no duplicates)
    util.subset = (a, b, op) => {
        var isSubset = true;
        for(var i in a)
            if(!(util.contains(b, op, a[i]))) {
                isSubset = false;
                break;
            }
        return isSubset;
    };

    util.once = func => {
        var beenCalled = false;
        return (...args) => {
            (beenCalled ? util.noop : func).apply(null, args);
            beenCalled = true;
        };
    };

    util.true = util.constant(true);
    util.trueP = util.constantP(true);

    util.and = (...preds) => {
        return function(...args) {
            return preds.every(p => p.apply(this, args));
        };
    };

    util.or = (...preds) => {
        return function(...args) {
            return preds.some(p => p.apply(this, args));
        };
    };

    util.getVisibleAttributes = ({ hiddenAttrIds: hiddenIds, inst: { attributes: allAttrs } }) =>
        allAttrs.filter(attr =>
            //If the id isn"t in the list of hidden id...
            hiddenIds.indexOf(attr.id) == -1);

    util.apply = f => function(args) {
        return f.apply(this, util.unwrapIfNeeded(args));
    };

    util.fieldEq = field => {
        var sel = util.selectorFor(field);

        return util.compose(
            util.apply(util.eq),
            util.pipeTransform(sel, sel)
        );
    };

    util.fieldEqTo = (field, x, eqTo = util.eqTo) =>
        util.compose(
            eqTo(x),
            util.selectorFor(field)
        );

    util.fieldEqToField = (field, a) => b =>
        util.fieldEq(field)(a, b);

    util.idEq = util.fieldEq("id");

    util.idEqTo = a => b => util.idEq(a, b);

    util.fieldIdEqTo = (field, x) =>
        util.fieldEqTo(field, x, util.idEqTo);

    util.elEq = (a, b) => a.is(b);

    util.selectAparPrice = (flightDate, priceList) =>{
        //12 am today
        var now = moment().startOf("day");

        //set the flight to be at midnight as well
        var flight = moment(flightDate).startOf("day");

        var daysBetween = flight.diff(now, "days");

        // If flight date is more than a month in the future, return ceiling price
        if(daysBetween >= 30)
            return priceList[0];

        // If it's today or in the past, return the floor price
        if(daysBetween <= 0)
            return priceList[priceList.length - 1];

        // Otherwise return the appropriate price from the array
        return priceList[30 - daysBetween];
    };

    util.selectPriceByComponent = (catRec, compName) => {
        return catRec.components.filter(comp => comp.component.name == compName)[0].price;
    };

    util.set = (obj, prop, val) => obj[prop] = val;
    util.setterFor = (obj, prop) => val => util.set(obj, prop, val);

    util.indexOf = (list, x, eq = util.eq) => {
        var pred = !util.isFunction(x)
            ? el => eq(x, el)
            : x;

        var index;
        for(var i in list)
            if(pred(list[i])) {
                index = parseInt(i);
                break;
            }

        return index;
    };

    util.unwrapXhr = f => x => f(x)[0];

    /*
        piecewise function builder

        parameters:
            test: mapping function
            cases: {
                caseVal: caseFunc
            }

        assumes single input param in generated function
    */
    util.piecewise = (test, cases) =>
        function(...args) {
            return cases[test.apply(this, args)].apply(this, args);
        };

    util.hasElements = list => list && list.length > 0;

    util.zip = (...lists) => {
        var longest = lists.reduce((max, list) =>
            Math.max(list.length, max), 0);

        var out = [];
        for(var pos = 0; pos < longest; pos++)
            out.push(lists.map(list => list[pos]));

        return out;
    };

    util.zipG = function*(...lists) {
        for(var pos in lists[0])
            yield lists.map(list => list[pos]);
    };

    util.typeof = x => typeof x;
    util.negate = util.piecewise(util.typeof, {
        boolean: x => !x,
        number: x => -x
    });

    util.cloneSimple = obj => JSON.parse(JSON.stringify(obj));

    util.fieldMerger = (obj, field) => {
        var setter = util.setterFor(obj, field);
        var assigner = (...args) => Object.assign({}, util.select(obj, field), ...args);

        return util.compose(setter, assigner);
    };

    util.setOptions = exports => util.fieldMerger(exports, "config");

    util.fieldNotNull = util.compose(
        selector => util.compose(util.isNotNull, selector),
        util.selectorFor
    );

    util.mapIfStrict = (pred, mapping) => value =>
        pred(value)
            ? mapping(value)
            : value;

    util.mapIfNotFunction = wrapper => util.mapIfStrict(
        util.pred.not(util.isFunction), wrapper);

    util.wrapConstant =
        util.mapIfNotFunction(util.constant);

    util.mapIf = (pred, mapping) =>
        util.mapIfStrict(pred, util.wrapConstant(mapping));

    // DSU implementation (decorate-sort-undecorate)
    // https://en.wikipedia.org/wiki/Schwartzian_transform
    util.mapSort = (arr, mapper, comparator) =>
        arr.map(x => [x, mapper(x)])
           .sort((a, b) => comparator(a[1], b[1]))
           .map(util.head);

    util.mapCompare = (mapper, comparator) =>
        (a, b) => comparator(mapper(a), mapper(b));

    util.comparator = {};

    util.comparator.lookup = (map, selector) =>
        util.mapCompare(
            util.compose(val => map[val], selector),
            util.comparator.numeric);

    util.comparator.numeric = (a, b) => a - b;

    util.comparator.alpha = (a, b) => a.localeCompare(b);

    util.comparator.adSize = (a, b) => {
        if(a == "Package") return 1;
        if(b == "Package") return -1;
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    };

    util.comparator.basic = (a, b) =>
        a == b
            ? 0
            : a > b
                ? 1
                : -1;

    util.mapCompareBasic = mapper => util.mapCompare(
        mapper, util.comparator.basic);

    const sizeCompare = util.mapCompareBasic(
        ({ key: { shard: { visibleSize }}}) =>
            visibleSize);
    const hashCompare = util.mapCompareBasic(
        ({ key: { shard: { visibleHash }}}) =>
            visibleHash);

    util.chainedCompare = (...comparators) => (a, b) => {
        for(const comparator of comparators) {
            const result = comparator(a, b);
            if(result != 0)
                return result;
        }

        return 0;
    };

    util.comparator.unitType = (a, b) => {
        if(a.attrTypes.length != b.attrTypes.length) {
            if(a.attrTypes.length > b.attrTypes.length)
                return -1;
            return 1;
        }

        return util.mapCompare(
            ut => ut.longName,
            util.comparator.alpha)(a, b);
    };

    util.comparator.group = util.chainedCompare(
        sizeCompare, hashCompare);

    const startCompare = util.mapCompare(
        ({ start }) => moment(start),
        util.comparator.numeric);
    const endCompare = util.mapCompare(
        ({ end }) => moment(end),
        util.comparator.numeric);

    util.comparator.collapsed = util.chainedCompare(
        startCompare, endCompare);

    util.displayErrors = errors =>
        errors.forEach(err =>
            Noty.error(err));

    util.errorMsg = (message, error) =>
        `${message} (${error})`;

    util.catch = async promise => {
        try {
            const resp = await promise;
            return resp;
        } catch({ message, stack }) {
            Noty.error(message);
            throw new Error(stack);
        }
    };

    //Global TZ change happens here
    util.utcTime = moment.utc;

    util.values = obj => Object.keys(obj).map(key => obj[key]);

    util.numCoalesce = num => {
        var parsed = parseInt(num);
        return !isNaN(parsed)
            ? parsed
            : num;
    };

    util.inBounds = (val, start, end) =>
        val >= start && val <= end;

    util.swap = (list, from, to) => {
        var swap = list[to];
        list[to] = list[from];
        list[from] = swap;
    };

    util.decrementAbsolute = val =>
        Math.sign(val) * (Math.abs(val) - 1);

    util.moveElement = (list, item, delta) => {
        var initialItemIndex = list.indexOf(item);
        var targetIndex = initialItemIndex + delta;

        //if move is legal
        if(!util.inBounds(targetIndex, 0, list.length-1))
            return;

        var currentIndex = initialItemIndex;
        for(; delta != 0; delta = util.decrementAbsolute(delta)) {
            var newIndex = currentIndex + Math.sign(delta);
            util.swap(list, currentIndex, newIndex);
            currentIndex = newIndex;
        }
    };

    util.jsogSerialize = (obj, nextId = 0, currVisited) => {
        var visited = currVisited || [obj];

        try {
            return JSON.stringify(obj);
        }
        catch(e) {
            return Object.keys(obj).map(key => {
                var out = {};

                var field = obj[key];

                if(util.isObject(field)) {
                    var fieldIndex = visited.indexOf(field);
                    if(fieldIndex >= 0) {
                        var id = (nextId++).toString();

                        visited[fieldIndex]["@id"] = id;
                        out[key] = { "@ref": id };

                        return out;
                    }
                    else
                        visited.push(field);
                }

                out[key] = util.jsogSerialize(field, nextId, visited);

                return out;
            }).reduce(Object.assign, {});
        }
    };

    util.toFormData = model => Object.entries(model)
        .reduce((formData, [key, value]) => {
            formData.append(key, value);
            return formData;
        }, new FormData());

    util.numberVal = el => parseInt(el.val());

    util.getMethods = obj => {
        var props = [];

        var proto = obj;
        do {
            props = props.concat(Object.entries(
                Object.getOwnPropertyDescriptors(proto)));

            proto = Object.getPrototypeOf(proto);
        } while(proto != Object.prototype);

        return props.filter(util.distinct(0))
            //filter out getters/setters
            .filter(([ name, { get, set }]) =>
                !(get || set))
            //grab the method
            .map(([ name, { value } ]) =>
                [name, value])
            .filter(([, value]) => util.isFunction(value));
    };

    util.distinct = keyField => {
        var keySelector = keyField
            ? util.selectorFor(keyField)
            : util.pipe;

        var seen = {};
        return obj => {
            var key = keySelector(obj);
            if(!seen[key])
                return seen[key] = true;

            return false;
        };
    };

    util.capitalize = string =>
        string[0].toUpperCase() + string.slice(1);

    util.categoryComparator = util.mapCompare(
        attr => attr.type.component.name,
        util.comparator.alpha);

    util.parseAndCap = (value, max = 0) => {
        return Math.min(Math.abs(parseFloat(value)), max);
    };

    util.roundPrice = (value, max = 0) => {
        return util.parseAndCap(value, max).toFixed(2);
    };

    util.pushError = (msg, errors) => {
        errors.push(msg);
        return true;
    };

    util.comparator.attribute = (a, b) => {
        if(a.type.category != b.type.category)
            return util.categoryComparator(a, b);

        if(a.type.name != b.type.name)
            return util.mapCompare(attr => attr.type.name, util.comparator.alpha)(a, b);

        return util.mapCompare(attr => attr.value, util.comparator.alpha)(a,  b);
    }

    util.toggleElement = (el, enable = true) => {
        if(enable)
            el.removeClass("hidden").removeClass("disabled");

        el.prop("disabled", !enable);

        return el;
    };

    util.toggleButton = (el, enable = true, andHide = false) => {
        el = util.toggleElement(el, enable);

        if(!enable) {
            el.off("click");
            if(andHide)
                el.addClass("hidden");
        }

        return el;
    };

    util.collectQueries = async queries => {
        const responses = await Promise.all(
            Object.entries(queries)
                .map(async ([ key, query ]) => {
                    const response = await query();
                    return [key, response];
                }));

        return responses.reduce((result, [key, response]) => {
            result[key] = response;
            return result;
        }, {});
    };

    util.viewMessages = controlName => (messageName, global = false) =>
        MX.strings.get(`${global
            ? ""
            : `${controlName}_`}${messageName}`);

    return util;
});
