define(["jquery", "app/renderer", "app/hub", "app/viewManager", "app/dal", "app/session", "d3", "app/dropdown",
        "app/dateRange", "app/repo/attrCache", "app/spinner", "app/util", "app/noty"],
function($, Renderer, hub, ViewManager, dal, Session, d3, Dropdown, DateRange, AttrCacheRepo, Spinner, util, Noty) {
    var dateRange;

    var firstAttrDropdown;
    var secondAttrDropdown;
    var chart;

    var attrTypes;
    var atHome = true;
    var currentColorPos = 0;

    var twoAttrsRequired = MX.strings.get("placementVis_error_twoAttrs");
    var firstAttrDropdownText = MX.strings.get("placementVis_firstAttrDropdown");
    var secondAttrDropdownText = MX.strings.get("placementVis_secondAttrDropdown");

    var visualize = async function() {
        Noty.closeAll();
        atHome = true;
        var firstAttr = firstAttrDropdown.selected.item;
        var secondAttr = secondAttrDropdown.selected.item;

        var errors = dateRange.validate();
        if(firstAttr == null || secondAttr == null)
            errors.push(twoAttrsRequired);

        if(errors.length > 0) {
            util.displayErrors(errors);
            return;
        }

        Noty.closeAll();
        currentColorPos = 0;
        $("#response").empty();
        Spinner.add($("#response"));

        chart.removeClass("hidden");

        const response = await dal.get("inv/data", {
            firstAttrTypeId: firstAttr.id,
            secondAttrTypeId: secondAttr.id,
            startDate: dateRange.getStart(),
            endDate: dateRange.getEnd() });

        chart.empty();
        renderTreeMap({
            name: "Inventory",
            subElements: response });

        Spinner.remove($("#response"));
    };

    var onTypeLoad = function(caches) {
        attrTypes = caches
            .filter(cache =>
                cache.type.component.name == "Placement")
            .map(cache => cache.type);

        firstAttrDropdown = new Dropdown(attrTypes, {
            container: $("#firstAttrTypeDropdown"),
            promptText: firstAttrDropdownText,
            textField: "name"
        });

        firstAttrDropdown.render();

        secondAttrDropdown = new Dropdown(attrTypes, {
            container: $("#secondAttrTypeDropdown"),
            promptText: secondAttrDropdownText,
            textField: "name"
        });

        secondAttrDropdown.render();

        firstAttrDropdown.change.subscribe(async ({ val }) => {
            const currentlySelected = secondAttrDropdown.selected.item;

            const filteredTypes = attrTypes.filter(type =>
                type.id != val);

            secondAttrDropdown.unrender();
            secondAttrDropdown = new Dropdown(filteredTypes, {
                container: $("#secondAttrTypeDropdown"),
                promptText: secondAttrDropdownText,
                textField: "name"
            });

            await secondAttrDropdown.render();
            if(currentlySelected != null)
                secondAttrDropdown.selectByVal(currentlySelected.id);
        });

        secondAttrDropdown.change.subscribe(async ({ val }) => {
            const currentlySelected = firstAttrDropdown.selected.item;

            const filteredTypes = attrTypes.filter(type =>
                type.id != val);

            firstAttrDropdown.unrender();
            firstAttrDropdown = new Dropdown(filteredTypes, {
                container: $("#firstAttrTypeDropdown"),
                promptText: firstAttrDropdownText,
                textField: "name"
            });

            await firstAttrDropdown.render();
            if(currentlySelected != null)
                firstAttrDropdown.selectByVal(currentlySelected.id);
        });

        $("#render").click(visualize);
    };

    var render = async function() {
        await ViewManager.renderView("placementVisualization");
        dateRange = new DateRange($("#dateRange"));
        dateRange.render();

        chart = $("#chart");

        //Create tooltip element for chart
        $("<div>").attr("id", "tooltip").appendTo($("body"));

        const caches = await AttrCacheRepo.get();
        onTypeLoad(caches);
    };

    var selectColor = function() {
        var MXColorScheme = ["#2c71b8", "#f58536", "#4e642f", "#d34c3d", "#d9a742", "#7c4267", "#5193CE", "#f58536", "#759c3d",
                                "#ff8181", "#ffc000", "#c0799d", "#1e5993", "#d76e2b", "#434b1d", "#8b3022", "#866929", "#552d47"];

        var color = MXColorScheme[currentColorPos];
        currentColorPos++;
        if(currentColorPos >= MXColorScheme.length)
            currentColorPos = 0;

        return color;
    };

    var renderTreeMap = function(data) {
        var body = d3.select("body");

        var tooltip = d3.select("#tooltip");

        function showTooltip(obj) {
            function getTipHtml(obj) {
                var parentName = obj.parent.name;
                var objName = obj.name;

                var impressionCount = d3.format(",f")(obj.value);
                var percentage = d3.format("%")(obj.value / data.value);

                var topRow = parentName == "Inventory" ? objName : `${parentName} &rarr; ${objName}`;
                var secondRow = `Units: ${impressionCount} (${percentage})`;

                return `<b> ${topRow} </b><br /> ${secondRow}`;
            }

            $(this).parent().find(".child").attr("opacity", "0.5");

            tooltip.style("display", null)
                .html(getTipHtml(obj));
        }

        function hideTooltip(obj) {
            $(this).parent().find(".child").attr("opacity", "1");
            tooltip.style("display", "none");
        }

        function updateTooltipPos(event) {
            var m = d3.mouse(body.node());
            tooltip.style("left", m[0] + 30 + "px")
                .style("top", m[1] - 20 + "px");
        }

        // This example has been adapted from Mike Bostocks Zooming treemap example at http://bost.ocks.org/mike/treemap/.
        // Many thanks to Mike for his excellent work in this area.
        var margin = { top: 30, right: 0, bottom: 0, left: 0 },
            width = chart.width(),
            height = chart.height(),
            formatNumber = d3.format(",d"),
            transitioning;

        var x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);

        var treemap = d3.layout.treemap()
            .children(function(d, depth) { return depth ? null : d.subElements; })
            .sort(function(a, b) { return a.value - b.value; })
            .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
            .round(false);

        var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

        var grandparent = svg.append("g")
            .attr("class", "grandparent");

        grandparent.append("rect")
            .attr("y", -margin.top)
            .attr("width", width)
            .attr("height", margin.top);

        grandparent.append("text")
            .attr("id", "homeBar")
            .attr("x", 6)
            .attr("y", 6 - margin.top)
            .attr("dy", ".75em")
            .text("Home");

        initialize(data);
        accumulate(data);
        layout(data);
        display(data);

        function initialize(root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
            root.depth = 0;
        }

        // Aggregate the values for internal nodes. This is normally done by the
        // treemap layout, but not here because of our custom implementation.
        function accumulate(d) {
            return d.subElements
                ? d.value = d.subElements.reduce(function(p, v) { return p + accumulate(v); }, 0)
                : d.value;
        }

        // Compute the treemap layout recursively such that each group of siblings
        // uses the same size (1×1) rather than the dimensions of the parent cell.
        // This optimizes the layout for the current zoom state. Note that a wrapper
        // object is created for the parent node for each group of siblings so that
        // the parent’s dimensions are not discarded as we recurse. Since each group
        // of sibling was laid out in 1×1, we must rescale to fit using absolute
        // coordinates. This lets us use a viewport to zoom.
        function layout(d) {
            if(d.subElements) {
                treemap.nodes({ subElements: d.subElements });
                d.subElements.forEach(function(c) {
                    c.x = d.x + c.x * d.dx;
                    c.y = d.y + c.y * d.dy;
                    c.dx *= d.dx;
                    c.dy *= d.dy;
                    c.parent = d;
                    layout(c);
                });
            }
        }

        function display(d) {
            grandparent
                .datum(d.parent)
                .on("click", transition)
                .select("text");

            var g1 = svg.insert("g", ".grandparent")
                .datum(d)
                .attr("class", "depth");

            var g = g1.selectAll("g")
                .data(d.subElements)
                .enter().append("g");

            g.filter(function(d) { return d.subElements; })
                .classed("subElements", true)
                .on("click", transition);

            g.selectAll(".child")
                .data(function(d) { return d.subElements || [d]; })
                .enter().append("rect")
                .attr("class", "child")
                .call(rect);

            g.append("rect")
                .attr("class", "parent")
                .call(rect)
                .on("mouseover", showTooltip)
                .on("mouseout", hideTooltip)
                .on("mousemove", updateTooltipPos);

            g.append("text")
                .attr("dy", ".75em")
                .attr("class", "boxText")
                .text(function(d) { return d.attrType + ": " + d.name; });

            wrapTextInBoxes();

            var color = d3.scale.category20c();
            var colors = {};
            g.filter(function(d) {
                var parent_depth = (d.parent).depth;
                var current_node = d;
                if (parent_depth != 0) {
                    current_node = d.parent;
                }
                if (!current_node.color) {
                    current_node.color = selectColor(); //color(current_node.name);
                }
                $(this).find(".child").css("fill", current_node.color);
            });

            function transition(d) {
                if (transitioning || !d) return;
                transitioning = true;

                if(atHome)
                {
                    d3.select("#homeBar").html("Back");
                    atHome = false;
                }
                else
                {
                    d3.select("#homeBar").html("Home");
                    atHome = true;
                }

                var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

                // Update the domain only after entering new elements.
                x.domain([d.x, d.x + d.dx]);
                y.domain([d.y, d.y + d.dy]);

                // Enable anti-aliasing during the transition.
                svg.style("shape-rendering", null);

                // Draw child nodes on top of parent nodes.
                svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

                // Fade-in entering text.
                g2.selectAll("text").style("fill-opacity", 0);

                // Transition to the new view.
                t1.selectAll("text").call(text).style("fill-opacity", 0);
                t2.selectAll("text").call(text).style("fill-opacity", 1);
                t1.selectAll("rect").call(rect);
                t2.selectAll("rect").call(rect);

                // Remove the old node when the transition is finished.
                t1.remove().each("end", function() {
                    svg.style("shape-rendering", "crispEdges");
                    transitioning = false;

                    wrapTextInBoxes();
                });
            }

            return g;
        }

        function wrapTextInBoxes() {
            //Wrap text so it doesn't overflow out of box
            d3.selectAll(".boxText").each(function() {
                d3.select(this).call(wrap, $(this.parentNode).find(".parent").attr("width"));
            });
        }

        function wrap(text, width) {
            text.attr("x", function(d) { return x(d.x) + 6; })
                .attr("y", function(d) { return y(d.y) + 6; });
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).attr("x", function(d) { return x(d.x) + 6; }).append("tspan");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", function(d) { return x(d.x) + 6; }).attr("dy", ++lineNumber * lineHeight + "em").text(word);
                    }
                }
            });
        }

        function text(text) {
            text.attr("x", function(d) { return x(d.x) + 6; })
                .attr("y", function(d) { return y(d.y) + 6; });
        }

        function rect(rect) {
            rect.attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
                .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
                .attr("id", function(d) { return d.name; });
        }
    };

    hub.sub("app/route/placementVisualization", render);
});
