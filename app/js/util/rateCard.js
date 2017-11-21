define(["app/util", "app/util/unitType"], function(util, utUtil) {
    var rcUtil = {};

    rcUtil.collectAdSizesFromRows = function(rows) {
        const uniques = {};
        rows.forEach(row =>
            row.columns.forEach(col =>
                uniques[col.adSize.value] = col.adSize));

        var adSizes = util.values(uniques);

        //first sort if needed
        if(adSizes.length > 1)
            adSizes = util.mapSort(adSizes,
                util.selectorFor("value"),
                util.comparator.adSize);

        return adSizes;
    };

    rcUtil.generateTableColumnsFromRows = function(rows) {
        var columns = [{
            name: "",
            accessor: () => " ",
            type: "string"
        },
        {
            name: "",
            accessor: util.selectorFor("type.longName"),
            type: "string"
        }];

        var adSizes = rcUtil.collectAdSizesFromRows(rows);
        columns = columns.concat(adSizes.map(size => ({
            name: size.value,
            accessor: row => {
                const reqColumn = util.whereEq(row.columns, "adSize.value", size.value)[0];
                return reqColumn.price.toFixed(2);
            },
            type: "numberField"
        })));

        return columns;
    };

    //NOTE: The Package "Adsize" only exists on the frontend. In backend, the column's adSize points to null.
    rcUtil.replaceNullWithPackageAdSizeInRows = function(rows, packageAdSize) {
        rows.forEach(row =>
            row.columns
                .filter(col =>
                    util.isNull(col.adSize))
                .forEach(col =>
                    col.adSize = packageAdSize));
    };

    rcUtil.tableRenderFuncFromRows = function(me, card, canEdit, unitTypes, adSizes) {
        return (el, model) => {
            //remove button
            if(canEdit) {
                var label = el.parent().find("td")[0];
                const deleteButton = $("<input>")
                    .attr({
                        type: "button",
                        value: "X"
                    }).addClass("rcedit inlineDelete hidden")
                    .prependTo(label)
                    .click(() => {
                        el.parent().remove();
                        card.rows = card.rows.filter(row => row.type != model.type);
                        rcUtil.setUpUnitTypeDD(me, unitTypes, adSizes);
                    });

                if(me.canEdit && me.editLayoutMode)
                    deleteButton.removeClass("hidden");
            }

            //input boxes
            var usedAdSizes = rcUtil.collectAdSizesFromRows(card.rows);

            var adSizeColumns = el.parent().find("td");
            adSizeColumns = adSizeColumns.slice(2, adSizeColumns.length);
            adSizeColumns.each((idx, col) => {
                const input = $(col).find("input");
                if(input.length < 1)
                    return;

                const adSize = usedAdSizes[idx];

                var targetCol = model.columns.filter(rccol =>
                    rccol.adSize == adSize);
                if(targetCol.length < 1) {
                    input.remove();
                    return;
                }
                targetCol = targetCol[0];

                input.change(function() {
                    const val =  parseFloat(Math.abs(input[0].value)).toFixed(2);
                    input[0].value = val;
                    targetCol.price = parseFloat(val);
                });

                input[0].addEventListener("readBack", () =>
                    input[0].value = targetCol.price.toFixed(2), false);

                if(!canEdit || me.editLayoutMode)
                    input.prop("disabled", true);
            });
        };
    };

    rcUtil.setUpAdSizeDD = async function(me, unitTypes, adSizes) {
        var usedASs = rcUtil.collectAdSizesFromRows(me.model.rows)
            .reduce((acc, val) => {
                acc[val.value] = true;
                return acc;
            }, {});

        var usableASs = adSizes.filter(as =>
            !usedASs[as.value]);

        me.adSizeDD = me.generateAdSizeDD(usableASs);

        await me.adSizeDD.render();
        me.adSizeDD.change.subscribe(({ item }) => {
            me.elements.adSizeDD.addClass("hidden");
            me.elements.btnAddAdSize.removeClass("hidden");

            me.model.rows.forEach(row =>
                row.columns.push({
                    adSize: item,
                    price: 0.01
                }));

            rcUtil.setUpAdSizeDD(me, unitTypes, adSizes);
            rcUtil.renderTable(me, unitTypes, adSizes);
        });

        if(usableASs.length > 0 && me.editLayoutMode)
            me.elements.btnAddAdSize.removeClass("hidden");
        else
            me.elements.btnAddAdSize.addClass("hidden");
    };

    rcUtil.setUpColumnDeletes = function(me, table, unitTypes, adSizes) {
        var usedAdSizes = rcUtil.collectAdSizesFromRows(me.model.rows);
        var titleCols = table.find("th");

        //pop off non-rateCardColumn columns and package Columns
        titleCols = titleCols.slice(2, titleCols.length - 1);
        titleCols.each((idx, col) => {
            const deleteButton = $("<input>")
                .attr({
                    type: "button",
                    value: "X"
                }).addClass("rcedit inlineDelete hidden")
                .prependTo(col)
                .click(() => {
                    me.model.rows.forEach(row =>
                        row.columns = row.columns.filter(rccol =>
                            rccol.adSize != usedAdSizes[idx]));

                    rcUtil.setUpAdSizeDD(me, unitTypes, adSizes);
                    rcUtil.renderTable(me, unitTypes, adSizes);
                });

            if(me.canEdit && me.editLayoutMode)
                deleteButton.removeClass("hidden");
        });
    };

    rcUtil.setUpButtonAddAdSize = function(me, unitTypes, adSizes) {
        me.elements.btnAddAdSize.click(() => {
            me.elements.btnAddAdSize.addClass("hidden");
            me.elements.adSizeDD.removeClass("hidden");
        });
        rcUtil.setUpAdSizeDD(me, unitTypes, adSizes);
    };

    rcUtil.generateUnitTypeDDOnChangeHandler = function(me, unitTypes, adSizes) {
        return function({ item }) {
            me.elements.unitTypeDD.addClass("hidden");
            me.elements.btnAddUnitType.removeClass("hidden");

            const usedAdSizes = rcUtil.collectAdSizesFromRows(me.model.rows);
            const columns = usedAdSizes.map(size => ({
                adSize: size,
                price: 0.01
            }));

            me.model.rows.push({
                type: item,
                columns: columns
            });
            rcUtil.setUpUnitTypeDD(me, unitTypes, adSizes);
            rcUtil.renderTable(me, unitTypes, adSizes);
        };
    };

    rcUtil.setUpUnitTypeDD = async function(me, unitTypes, adSizes) {
        const usedUTs = me.model.rows.reduce((acc, val) => {
            acc[val.type.shortName] = true;
            return acc;
        }, {});

        const usableUTs = unitTypes.filter(ut =>
            !usedUTs[ut.shortName]);

        me.unitTypeDD = me.generateUnitTypeDD(usableUTs);
        await me.unitTypeDD.render();

        me.unitTypeDD.change.subscribe(
            rcUtil.generateUnitTypeDDOnChangeHandler(me, unitTypes, adSizes));

        if(usableUTs.length > 0 && me.editLayoutMode)
            me.elements.btnAddUnitType.removeClass("hidden");
        else
            me.elements.btnAddUnitType.addClass("hidden");
    };

    rcUtil.setUpButtonAddUnitType = function(me, unitTypes, adSizes) {
        me.elements.btnAddUnitType.click(() => {
            me.elements.btnAddUnitType.addClass("hidden");
            me.elements.unitTypeDD.removeClass("hidden");
        });
        rcUtil.setUpUnitTypeDD(me, unitTypes, adSizes);
    };

    rcUtil.renderTable = async function(me, unitTypes, adSizes) {
        me.model.rows = me.model.rows.sort(
            util.mapCompare(row => row.type,
                util.comparator.unitType));

        me.table = me.generateTable(me.elements.table,
            me.model.rows,
            rcUtil.generateTableColumnsFromRows(me.model.rows));

        const t = await me.table.render(
            rcUtil.tableRenderFuncFromRows(me, me.model, me.canEdit, unitTypes, adSizes));

        if(me.canEdit)
            rcUtil.setUpColumnDeletes(me, t, unitTypes, adSizes);
    };

    rcUtil.copyTableIntoTable = function(Source, Target) {
        var sourceUTtoRowtoCol = utUtil.objectsToUnitTypeToObjectMap(Source.rows, "type");
        Object.keys(sourceUTtoRowtoCol).forEach(key => {
            var row = sourceUTtoRowtoCol[key];
            var RowtoCol = row.columns.reduce((acc, val) => {
                acc[val.adSize.value] = val;
                return acc;
            }, {});
            sourceUTtoRowtoCol[key] = RowtoCol;
        });
        Target.rows.forEach(row =>
            row.columns.forEach(col =>
                col.price = sourceUTtoRowtoCol[row.type.shortName][col.adSize.value].price
            )
        );
    };

    return rcUtil;
});
