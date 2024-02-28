let bfNodeEncoding = "plain";
let bfEdgeEncoding = "plain";
let bfNodeAttribute = undefined;
let bfEdgeAttribute = undefined;
let bfNodeOrdering = "alphabetical";
let bfOrderingNode = undefined;
let bfEdgeOrdering = "nodes";
//let bfNodeShading = false;
let bfDoubleEdges = false;
let bfStairs = false;
let bfEscalators = false;
// let selectedNode = undefined;
// let selectedEdge = undefined;

let nodeDistance, edgeDistance, widthForEdges, widthForNodeBars, squareSize; /*, fontSize, smallFontSize;
let nodeColors, edgeColors;

const triangle = d3.symbol().type(d3.symbolTriangle2);
triangle.size(50);
const path = triangle();*/

let stairs = [];
let escalators = [];

function biofabric(view, data) {
    // network properties
    const nodes = data.nodes;
    console.log(nodes)
    let edges = data.edges;
    const nodeAttributes = getAttributeLabels(nodes);
    console.log(nodeAttributes)
    const edgeAttributes = getAttributeLabels(edges);
    console.log(edgeAttributes)

    // visualization properties
    nodeDistance = (bfEdgeEncoding.toLowerCase().includes("juxta") ? 2 / 3 : 1) * (view.height - margins.top - margins.bottom) / nodes.length;
    widthForEdges = (bfNodeEncoding.toLowerCase().includes("juxta") ? 2 / 3 : 1) * (view.width - margins.left - margins.right);

    widthForNodeBars = bfNodeEncoding === "barLine" ? .05 * widthForEdges : 0;
    edgeDistance = (widthForEdges - widthForNodeBars) / edges.length * (bfDoubleEdges ? .5 : 1);
    squareSize = Math.min(15, Math.max(3, edgeDistance * 0.5, nodeDistance * 0.5));

    // TODO: adapt font size and colors
    const max_nameLength = Math.max(...nodes.map(n => n.name.length));
    fontSize = study ? (nodes.length < 30 ? 14 : (nodes.length < 60 ? 12 : 10)) : (Math.min(max_nameLength < 7 ? 20 : 10, max_nameLength < 10 ? cellSize * 0.5 : cellSize * 0.25));
    smallFontSize = 10;

    const modSet1 = ["#377eb8", "#984ea3", "#ff7f00", "#a65628", "#f781bf", "#999999"];
    nodeColors = d3.scaleOrdinal(modSet1).domain(nodeAttributes);
    const modSet2 = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"];
    edgeColors = d3.scaleOrdinal(modSet2).domain(edgeAttributes);

    const g = view.g.append("g").attr("id", "bf");

    // handle nodes
    sortNodes(nodes, nodeAttributes, edges, data);
    const nodePositions = {};
    nodes.forEach(function (d, i) {
        nodePositions[d.id] = nodeDistance * (i + 0.5);
    });
    const degrees = getDegrees(nodes, edges);

    const node = g.append("g").attr("class", "nodes")
        .attr("transform", "translate(" + margins.left + ", " + margins.top + ")");
    const ids = nodes.map(x => x.id);
    drawNodes(node, nodes, nodePositions);
    visualizeNodeAttributes(view, nodes, nodePositions, nodeAttributes);

    // handle edges
    let swapped = edges.map(function (d) {
        return {"source": d.target, "target": d.source, "attributes": d.attributes};
    });
    const doubled = edges.concat(swapped);

    if (bfDoubleEdges) {
        edges = doubled;
    } else {
        unifyEdges();
    }

    sortEdges(nodes, edgeAttributes, edges);
    const edge = g.append("g")
        .attr("class", "edges")
        .attr("transform", "translate(" + (margins.left + widthForNodeBars) + ", " + margins.top + ")");
    drawEdges(edge, edges, nodePositions);
    visualizeEdgeAttributes(view, edges, edgeAttributes);
    addSquares(edge, nodePositions);

    // handle interaction
    //addSelection(g, nodes, nodePositions, edges);
    enableEdgeInteraction(edge, nodePositions, edges);
    enableNodeInteraction(node, nodePositions, edges);
    addOrderingPossibilities(g, view, data);

    // identify patterns
    stairs = [];
    escalators = [];
    [stairs, qualities] = detectStairs();
    switchStairsBF(d3.selectAll("#stairsBF").property("checked"));
    escalators = detectEscalators();
    switchEscalatorsBF(d3.selectAll("#escalatorsBF").property("checked"));
    addStatistics();

    // organizer functions
    function sortNodes(nodes, attributes, edges, data) {
        switch (bfNodeOrdering.toLowerCase()) {
            case "random":
                sortRandomly(nodes);
                break;
            case "alphabetical" :
                sortAlphabetically(nodes);
                break;
            case "mean" :
                sortByMean(nodes);
                break;
            case "degree" :
                sortByDegree(nodes, edges);
                break;
            case "edges" :
            case "rcm" :
                sortByRCM(data);
                break;
            case "adjacency":
                sortByNeighborhood(nodes, edges, bfOrderingNode);
                break;
            case "cluster":
                // TODO
                break;
            case "gansner":
                sortByGansner(nodes);
                break;
            default :
                if (attributes.includes(bfNodeOrdering)) {
                    sortByAttribute(bfNodeOrdering, nodes);
                }
                break;
        }
    }

    function drawNodes(g, nodes, positions) {
        let posOffset = ".35em";
        let negOffset = "-.35em";
        const vis = g.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", x => "translate(0, " + positions[x.id] + ")");

        vis.append("line")
            .attr("class", "baseline")
            .attr("x2", widthForEdges)
            .attr("fill", "none")
            .attr("stroke", "gray");

        vis.append("text")
            .text(x => x.name)
            .attr("dx", negOffset)
            .attr("dy", posOffset)
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .attr("font-size", fontSize);
    }

    function sortEdges(nodes, attributes, edges) {
        if (bfDoubleEdges) {
            sortBySourceNodes(nodes, edges, attributes, bfEdgeOrdering);
        } else {
            switch (bfEdgeOrdering.toLowerCase()) {
                case "random":
                    sortRandomly(edges);
                    break;
                case "nodes" :
                    sortByNodes(nodes, edges);
                    break;
                case "degree":
                    sortEdgesByDegree(nodes, edges);
                    break;
                case "mean" :
                    sortByMean(edges);
                    break;
                case "staircases":
                    sortForStaircases(nodes, edges);
                    break;
                default :
                    if (attributes.includes(bfEdgeOrdering)) {
                        sortByNodes(nodes, edges);
                        sortByAttribute(bfEdgeOrdering, edges);
                    } else if (Array.isArray(bfEdgeOrdering) && bfEdgeOrdering.map(a => edgeAttributes.includes(a)).every(Boolean)) {
                        sortByNodes(nodes, edges);
                        sortByTwoAttributes(bfEdgeOrdering, edges);
                    }
                    break;
            }
        }
    }

    function unifyEdges() {
        edges.forEach(function (d) {
            if (ids.indexOf(d.source) > ids.indexOf(d.target)) {    // source is always at top
                let tmp = d.source;
                d.source = d.target;
                d.target = tmp;
            }
        });
    }

    function drawEdges(g, edges, positions) {
        g.selectAll("g")
            .data(edges)
            .enter()
            .append("g")
            .attr("transform", (x, i) => "translate(" + (edgeDistance * (i + 0.5)) + ", 0)")
            .append("line")
            .attr("class", "baseline")
            .attr("y1", x => positions[x.source])
            .attr("y2", x => positions[x.target])
            .attr("fill", "none")
            .attr("stroke", "black");
    }

    function addSquares(g, positions) {
        const sources = g.selectAll("g").append("rect")
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("x", -squareSize / 2)
            .attr("y", x => positions[x.source] - squareSize / 2)
            .attr("fill", "black");

        const targets = g.selectAll("g").append("rect")
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("x", -squareSize / 2)
            .attr("y", x => positions[x.target] - squareSize / 2)
            .attr("fill", "black");

        // adapt to multiple node lines
        if (["parallelLine", "dashedLine"].includes(bfNodeEncoding)) {
            const maxWidth = Math.max(1, Math.min(10, 2 / 3 * nodeDistance / nodeAttributes.length));
            sources.attr("height", function (e) {
                let source = nodes.find(n => n.id === e.source);
                return Math.max(Object.keys(source.attributes).length * (maxWidth + 2), squareSize);
            })
                .attr("y", function (e) {
                    let source = nodes.find(n => n.id === e.source);
                    let max = Object.keys(source.attributes).length;
                    if (max * (maxWidth + 2) > squareSize) {
                        if (max % 2 === 0) {
                            return positions[e.source] - (max + 1) * (maxWidth + 2) / 2;
                        } else {
                            return positions[e.source] - max * (maxWidth + 2) / 2;
                        }
                    } else {
                        return positions[e.source] - squareSize / 2;
                    }
                });

            targets.attr("height", function (e) {
                let source = nodes.find(n => n.id === e.target);
                return Math.max(Object.keys(source.attributes).length * (maxWidth + 2), squareSize);
            })
                .attr("y", function (e) {
                    let source = nodes.find(n => n.id === e.target);
                    let max = Object.keys(source.attributes).length;
                    if (max * (maxWidth + 2) > squareSize) {
                        if (max % 2 === 0) {
                            return positions[e.target] - (max + 1) * (maxWidth + 2) / 2;
                        } else {
                            return positions[e.target] - max * (maxWidth + 2) / 2;
                        }
                    } else {
                        return positions[e.target] - squareSize / 2;
                    }
                });
        } else if (bfNodeEncoding === "curvedLine") {
            sources.attr("height", 2 * nodeDistance / 3 + 4)
                .attr("y", function (e) {
                    return positions[e.source] - nodeDistance / 3 - 2;
                });

            targets.attr("height", 2 * nodeDistance / 3 + 4)
                .attr("y", function (e) {
                    return positions[e.target] - nodeDistance / 3 - 2;
                });
        }

        if (["parallel", "parallelAndJuxta", "dashed"].includes(bfEdgeEncoding)) {
            const maxWidth = Math.max(1, Math.min(10, 2 / 3 * nodeDistance / edgeAttributes.length));
            sources.attr("width", function (e) {
                return Math.max(Object.keys(e.attributes).length * (maxWidth + 2), squareSize);
            })
                .attr("x", function (e) {
                    if (Object.keys(e.attributes).length < 2) {
                        return -squareSize / 2;
                    } else {
                        return -0.5 * maxWidth - Math.round((Object.keys(e.attributes).length - 1) / 2) * (maxWidth + 2);
                    }
                });

            targets.attr("width", function (e) {
                return Math.max(Object.keys(e.attributes).length * (maxWidth + 2), squareSize);
            })
                .attr("x", function (e) {
                    if (Object.keys(e.attributes).length < 2) {
                        return -squareSize / 2;
                    } else {
                        return -0.5 * maxWidth - Math.round((Object.keys(e.attributes).length - 1) / 2) * (maxWidth + 2);
                    }
                });
        } /*else if (bfEdgeEncoding === "dashed") {
            const maxWidth = Math.max(1, Math.min(10, 2/3 * nodeDistance / edgeAttributes.length));
            sources.attr("width", function (e) {
                return Math.max(Object.keys(e.attributes).length * (maxWidth / 2 + 2), squareSize);
            })
                .attr("x", function (e) {
                    if (Object.keys(e.attributes).length < 2) {
                        return - squareSize / 2;
                    } else {
                        return - maxWidth / 4 - Math.round((Object.keys(e.attributes).length - 1) / 2) * (maxWidth / 2 + 2);
                    }
                });

            targets.attr("width", function (e) {
                return Math.max(Object.keys(e.attributes).length * (maxWidth / 2 + 2), squareSize);
            })
                .attr("x", function (e, i) {
                    if (Object.keys(e.attributes).length < 2) {
                        return edgeDistance * i - squareSize / 2;
                    } else {
                        return edgeDistance * i - maxWidth / 4 - Math.round((Object.keys(e.attributes).length - 1) / 2) * (maxWidth / 2 + 2);
                    }
                });
        }*/
    }

    function visualizeNodeAttributes(view, nodes, positions, attributes) {
        switch (bfNodeEncoding) {
            case "plain":
                break;
            case "colorCircle":
                coloredNodeCircles(bfNodeAttribute, nodes, attributes);
                break;
            case "barNodes" :
                barsOnNodes(nodes, attributes);
                break;
            case "colorLine":
                coloredNodeLines(bfNodeAttribute, nodes, attributes);
                break;
            case "parallelLine":
                parallelNodeLines(nodes, attributes);
                break;
            case "curvedLine":
                curvedNodeLines(nodes, attributes);
                break;
            case "dashedLine":
                dashedNodeLines(nodes, attributes);
                break;
            case "barLine":
                barsOnNodeLines(nodes, attributes);
                break;
            case "juxta":
                bfJuxtaposedNodeAttributes(view, nodes, positions, attributes);
                break;
        }
    }

    function visualizeEdgeAttributes(view, edges, attributes) {
        switch (bfEdgeEncoding) {
            case "plain":
                break;
            case "color":
                coloredEdgeLines(bfEdgeAttribute, edges, attributes);
                break;
            case "parallel":
                parallelEdges(edges, nodePositions, attributes);
                break;
            case "curved":
                curvedEdges(edges, nodePositions, attributes);
                break;
            case "dashed":
                dashedEdges(edges, nodePositions, attributes);
                break;
            case "bars":
                barsOnEdges(edges, nodePositions, attributes);
                break;
            case "juxta":
                juxtaposedEdgeAttributes(view, edges, nodes, nodePositions, attributes);
                break;
            case "parallelAndJuxta":
                parallelEdges(edges, nodePositions, attributes);
                juxtaposedEdgeAttributes(view, edges, nodes, nodePositions, attributes);
                break;
            case "barsAndJuxta":
                barsOnEdges(edges, nodePositions, attributes);
                juxtaposedEdgeAttributes(view, edges, nodes, nodePositions, attributes);
                break;
        }
    }

    function addOrderingPossibilities(g, view, data) {
        const buttons = g.append("g")
            .attr("class", "buttons");

        // alphabetically
        const alph = buttons.append("g")
            .attr("class", "alph");
        alph.append("rect")
            .attr("width", margins.left)
            .attr("height", fontSize * 1.5)
            .attr("fill", "white")
            .attr("stroke", "gray")
            .attr("stroke-width", "1px");
        alph.append("text")
            .text("Name")
            .attr("x", margins.left * 0.25)
            .attr("dy", "1em")
            .attr("text-anchor", "start")
            .attr("font-size", fontSize);
        alph.append("path")
            .attr("transform", "translate(10, " + (0.7 * fontSize) + ") rotate(180 0 0)")
            .attr("d", path)
            .attr("stroke", "gray")
            .attr("fill", "white");
        alph.on("click", function () {
            view.g.selectAll("*").remove();
            changeSelectedNodeOrderingBF("alphabetical");
            biofabric(view, data);
        });

        // gansner
        const gansner = buttons.append("g")
            .attr("class", "gansner")
            .attr("transform", "translate(0, " + fontSize * 2 + ")");
        gansner.append("rect")
            .attr("width", margins.left)
            .attr("height", fontSize * 1.5)
            .attr("fill", "white")
            .attr("stroke", "gray")
            .attr("stroke-width", "1px");
        gansner.append("text")
            .text("Gansner")
            .attr("x", margins.left * 0.25)
            .attr("dy", "1em")
            .attr("text-anchor", "start")
            .attr("font-size", fontSize);
        gansner.append("path")
            .attr("transform", "translate(10, " + (0.7 * fontSize) + ") rotate(180 0 0)")
            .attr("d", path)
            .attr("stroke", "gray")
            .attr("fill", "white");
        gansner.on("click", function () {
            view.g.selectAll("*").remove();
            changeSelectedNodeOrderingBF("gansner");
            biofabric(view, data);
        });

        // node attributes
        g.selectAll(".juxtatableNodes .header > g")
            .append("path")
            .attr("transform", "translate(10, " + (0.7 * fontSize) + ") rotate(180 0 0)")
            .attr("d", path)
            .attr("stroke", "gray")
            .attr("fill", "white");

        g.selectAll(".juxtatableNodes .header > g").on("click", function (event, d) {
            view.g.selectAll("*").remove();
            changeSelectedNodeOrderingBF(d);
            biofabric(view, data);
        });

        // edge attributes
        g.selectAll(".juxtatableEdges .header > g")
            .append("path")
            .attr("transform", "translate(10, 0) rotate(90 0 0)")
            .attr("d", path)
            .attr("stroke", "gray")
            .attr("fill", "white");

        g.selectAll(".juxtatableEdges .header > g").on("click", function (event, d) {
            view.g.selectAll("*").remove();
            changeSelectedEdgeOrderingBF(d);
            biofabric(view, data);
        });

        // adjacent nodes
        g.selectAll(".nodes text").attr("x", -fontSize * 1.5);
        let adjacenct = g.selectAll(".nodes g")
            .append("g")
            .attr("class", "sort")
            .attr("transform", "translate(" + (-fontSize * 1.5) + ", " + (-fontSize * 0.5) + ")");
        adjacenct.append("rect")
            .attr("width", fontSize)
            .attr("height", fontSize)
            .attr("fill", "gray")
            .attr("stroke", "gray")
            .attr("stroke-width", "1px");
        adjacenct.append("path")
            .attr("transform", "translate(" + (0.5 * fontSize) + "," + (0.5 * fontSize) + ") rotate(90 0 0)")
            .attr("d", path)
            .attr("stroke", "white")
            .attr("fill", "white");

        g.selectAll(".nodes .sort").on("click", function (event, d) {
            bfOrderingNode = d;
            selectedNode = d;
            changeSelectedNodeOrderingBF("adjacency");
            changeSelectedEdgeOrderingBF("nodes");
            view.g.selectAll("*").remove();
            biofabric(view, data);
        });

        bfHighlightSelectedNodeOrdering(bfNodeOrdering, bfOrderingNode, nodeAttributes);
        bfHighlightSelectedEdgeOrdering(bfEdgeOrdering, edgeAttributes);
    }

    function addSelection(g, nodes, positions, edges) {
        const size = 10;
        const selection = g.append("g")
            .attr("class", "selection")
            .attr("transform", "translate(0, " + margins.top + ")")
            .selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "checkbox")
            .attr("transform", function (d) {
                return "translate(0, " + positions[d.id] + ")";
            });

        selection.append("rect")
            .attr("transform", "translate(5, " + (-size / 2) + ")")
            .attr("width", size)
            .attr("height", size)
            .attr("stroke", "gray")
            .attr("fill", "white")
            .attr("stroke-width", "2px");

        selection.append("rect")
            .attr("class", "checkmark")
            .attr("transform", "translate(6, " + (-(size - 2) / 2) + ")")
            .attr("width", size - 2)
            .attr("height", size - 2)
            .attr("fill", "blue")
            .attr("fill-opacity", 0.6)
            .attr("display", "none");

        g.selectAll(".checkbox").on("mouseover", function (event, d) {
            highlightNodes(d3.selectAll("#bf .nodes g").filter(x => x === d), d, edges);
        }).on("mouseout", function () {
            removeHighlightedNodes();
        });

        g.selectAll(".checkbox").on("click", function () {
            if (d3.select(this).classed("checked")) {
                d3.select(this).classed("checked", false);
            } else {
                d3.select(this).classed("checked", true);
            }
        });
    }

    function enableNodeInteraction(node, positions, edges) {
        node.selectAll("g").append("rect")
            .attr("class", "background")
            .attr("x", -margins.left)
            .attr("y", -nodeDistance * 0.25)
            .attr("width", view.width)
            .attr("height", nodeDistance * 0.5)
            .attr("pointer-events", "visible")
            .attr("fill", "none")
            .lower();

        if (selectedNode !== null) {
            let selected = node.selectAll("g").filter(x => x.id === selectedNode.id);
            bfFixHighlightedNodes(selected, selected.data()[0], edges);
        }

        bfCreateNodeTooltip();
        node.selectAll("g").on("mouseover", function (event, d) {
            bfHighlightNodes(d3.select(this), d, edges);
            bfShowNodeTooltip(this, d, positions, nodes);
        });
        node.selectAll("g").on("mouseout", function () {
            bfRemoveHighlightedNodes();
            bfHideNodeTooltip();
        });
        node.selectAll("g").on("click", function (event, d) {
            bfFixHighlightedNodes(d3.select(this), d, edges);
        });
    }

    function enableEdgeInteraction(edge, positions, edges) {
        let offset = Math.min(nodeDistance * .25, squareSize);
        edge.selectAll("g").append("rect")
            .attr("class", "background")
            .attr("y", function (d) {
                return positions[d.source] > positions[d.target] ? positions[d.target] - offset : positions[d.source] - offset;
            })
            .attr("x", -0.25 * edgeDistance)
            .attr("width", edgeDistance * 0.5)
            .attr("height", function (d) {
                let start = positions[d.source] > positions[d.target] ? positions[d.target] : positions[d.source];
                if (bfEdgeEncoding.toLowerCase().includes("juxta")) {
                    return view.height - margins.top - margins.bottom - start + offset;
                } else {
                    return (positions[d.source] > positions[d.target] ? (positions[d.source] - positions[d.target]) : (positions[d.target] - positions[d.source])) + 2 * offset;
                }
            })
            .attr("pointer-events", "visible")
            .attr("fill", "none")
            .lower();

        if (selectedEdge !== null) {
            let selected = edge.selectAll("g").filter(x => x.target === selectedEdge.target && x.source === selectedEdge.source);
            bfFixHighlightedEdges(selected, selected.data()[0]);
        }

        bfCreateEdgeTooltip();
        edge.selectAll("g").on("mouseover", function (event, d) {
            bfHighlightEdges(d3.select(this), d);
            bfShowEdgeTooltip(this, d, positions, edges);
        });
        edge.selectAll("g").on("mouseout", function () {
            bfRemoveHighlightedEdges();
            bfHideEdgeTooltip();
        });
        edge.selectAll("g").on("click", function (event, d) {
            bfFixHighlightedEdges(d3.select(this), d);
        });
    }

    function detectStairs() {
        const whatIsAStair = 3; // at least 3 steps
        const delta = 2; // infinite or predefined (max. 2)

        const order = {};
        nodes.forEach((d, i) => order[d.id] = i);

        let fixed = null;
        let direction = null;

        let previous = null;

        let stairs = [];
        let current = [];

        let fixedNodes = [];
        let types = [];
        let type = null;

        edges.forEach(function (d) {
            if (fixed != null) { // check further stair
                if (fixed === d.source) {
                    let diff = order[d.target] - order[previous.target];
                    let cross = order[d.target] - order[previous.source];
                    if (direction === "increasing" && diff > 0 && diff <= delta) { // same upper node, increasing edge length
                        if (Math.abs(diff) !== 1) {type = "semi optimal";}
                        current.push(d);
                    } else if (direction === "decreasing" && diff < 0 && Math.abs(diff) <= delta) { // same upper node, decreasing edge length
                        if (Math.abs(diff) !== 1) {type = "semi optimal";}
                        current.push(d);
                    } else if (fixed === previous.target && direction === "decreasing" && cross > 0 && cross <= delta) { // switch
                        direction = "increasing";
                        type = "semi optimal";
                        current.push(d);
                    } else if (current.length >= whatIsAStair) { // end of stair
                        stairs.push(current);
                        fixedNodes.push(fixed);
                        types.push(type);
                        current = [];
                        fixed = null;
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else if (fixed === d.target) {
                    let diff = order[d.source] - order[previous.source]
                    let cross = order[d.source] - order[previous.target];
                    if (direction === "increasing" && diff < 0 && Math.abs(diff) <= delta) { // same lower node, increasing edge length
                        if (Math.abs(diff) !== 1) {type = "semi optimal";}
                        current.push(d)
                    } else if (direction === "decreasing" && diff > 0 && diff <= delta) { // same lower node, decreasing edge length
                        if (Math.abs(diff) !== 1) {type = "semi optimal";}
                        current.push(d)
                    } else if (fixed === previous.source && direction === "decreasing" && cross < 0 && Math.abs(cross) <= delta) { // switch
                        direction = "increasing";
                        type = "semi optimal";
                        current.push(d);
                    } else if (current.length >= whatIsAStair) { // end of stair
                        stairs.push(current);
                        fixedNodes.push(fixed);
                        types.push(type);
                        current = [];
                        fixed = null;
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else if (current.length >= whatIsAStair) { // end of stair
                    stairs.push(current);
                    fixedNodes.push(fixed);
                    types.push(type);
                    current = [];
                    fixed = null;
                } else { // no stair
                    current = [];
                    fixed = null;
                }
            }

            if (fixed == null && previous !== null) { // new stair possible
                current.push(previous);
                type = "optimal"
                if (previous.source === d.source) {
                    fixed = previous.source;
                    let diff = order[d.target] - order[previous.target];
                    if (Math.abs(diff) !== 1) {type = "semi optimal";}
                    if (diff > 0 && diff <= delta) { // same upper node, increasing edge length
                        direction = "increasing";
                        current.push(d);
                    } else if (diff < 0 && Math.abs(diff) <= delta) { // same upper node, decreasing edge length
                        direction = "decreasing";
                        current.push(d);
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else if (previous.target === d.target) {
                    fixed = previous.target;
                    let diff = order[d.source] - order[previous.source];
                    if (Math.abs(diff) !== 1) {type = "semi optimal";}
                    if (diff < 0 && Math.abs(diff) <= delta) { // same lower node, increasing edge length
                        direction = "increasing";
                        current.push(d)
                    } else if (diff > 0 && diff <= delta) { // same lower node, decreasing edge length
                        direction = "decreasing";
                        current.push(d)
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else if (previous.source === d.target) {
                    fixed = previous.source;
                    type = "semi optimal";
                    let cross = order[d.source] - order[previous.target];
                    if (cross < 0 && Math.abs(cross) <= delta) { // switch
                        direction = "increasing";
                        current.push(d)
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else if (previous.target === d.source) {
                    fixed = previous.target;
                    type = "semi optimal";
                    let cross = order[d.target] - order[previous.source];
                    if (cross > 0 && cross <= delta) { // switch
                        direction = "increasing";
                        current.push(d)
                    } else { // no stair
                        current = [];
                        fixed = null;
                    }
                } else {
                    current = [];
                }
            }

            previous = d;
        })

        if (current.length >= whatIsAStair) { // end of stair
            stairs.push(current);
            fixedNodes.push(fixed);
            types.push(type);
        }

        let qualities = getQualityOfStairs(stairs, fixedNodes, types);
        return [stairs, qualities];
    }

    function getQualityOfStairs(stairs, nodes, types) {
        let qualities = [];
        stairs.forEach(function (d, i) {
            qualities.push([types[i], d.length / degrees[nodes[i]]])
        })
        return qualities;
    }

    function detectEscalators() {
        const whatIsAnEscalator = 3; // at least three steps
        const delta1 =  1; // infinite or predefined (max. 2)
        const delta2 =  1; // infinite or predefined (max. 2)

        const order = {};
        nodes.forEach((d, i) => order[d.id] = i);

        let direction = null;
        let previous = null;

        let escalators = [];
        let current = [];
        edges.forEach(function (d) {
            if (direction != null) { // check further escalator
                let diffSources = order[d.source] - order[previous.source];
                let diffTargets = order[d.target] - order[previous.target];
                if (direction === "decreasing") {
                    if (diffSources === 1 && diffTargets === 1) { // escalator continues decreasingly
                        current.push(d);
                    } else if (diffSources === 1 && diffTargets > 0 && diffTargets <= delta2) { // end of escalator
                        current.push(d);
                        escalators.push(current);
                        current = [];
                        direction = null;
                    } else if (current.length >= whatIsAnEscalator) { // end of escalator
                        escalators.push(current);
                        current = [];
                        direction = null;
                    } else { // no escalator
                        current = [];
                        direction = null;
                    }
                } else if (direction === "increasing") {
                    if (diffSources === -1 && diffTargets === -1) { // escalator continues increasingly
                        current.push(d);
                    } else if (diffSources === -1 && diffTargets < 0 && Math.abs(diffTargets) <= delta2) { // end of escalator
                        current.push(d);
                        escalators.push(current);
                        current = [];
                        direction = null;
                    } else if (current.length >= whatIsAnEscalator) { // end of escalator
                        escalators.push(current);
                        current = [];
                        direction = null;
                    } else { // no escalator
                        current = [];
                        direction = null;
                    }
                }
            }

            if (direction == null && previous !== null) { // new escalator possible
                current.push(previous);
                let diffSources = order[d.source] - order[previous.source];
                let diffTargets = order[d.target] - order[previous.target];
                if (diffSources > 0 && diffSources <= delta1 && diffTargets > 0 && diffTargets === 1) {
                    direction = "decreasing"
                    current.push(d);
                } else if (diffSources < 0 && Math.abs(diffSources) <= delta1 && diffTargets < 0 && Math.abs(diffTargets) === 1) {
                    direction = "increasing"
                    current.push(d);
                } else {
                    current = [];
                }
            }

            previous = d;
        })

        if (current.length >= whatIsAnEscalator) { // end of escalator
            escalators.push(current);
        }

        return escalators;
    }

    function addStatistics() {
        const ids = nodes.map(x => x.id)
        const lengths = edges.map(x => Math.abs(ids.indexOf(x.source) - ids.indexOf(x.target)))
        const sum = lengths.reduce((acc, num) => acc + num, 0);
        const average = sum / lengths.length;
        const max = Math.max(...lengths);
        const min = Math.min(...lengths);

        let fontSizeStats = 14;
        const vis = g.append("g")
            .attr("class", "stats")
            .attr("transform", "translate(" + (margins.left * 1.5) + ", " + fontSizeStats + ")")
            .append("text")
            .attr("font-size", fontSizeStats)
            .attr("font-weight", "bold")
            .text("Edge length");

        let stats = ["avg: " + parseFloat(average.toFixed(3)), "min: " + min, "max: " + max];
        vis.selectAll("tspan")
            .data(stats)
            .enter()
            .append("tspan")
            .attr("y", 0)
            .attr("font-weight", "normal")
            .attr("dx", "22")
            .text(d => d);

        vis.append("tspan")
            .attr("x", 0)
            .attr("font-weight", "bold")
            .attr("dy", "22")
            .text("# Stairs");
        vis.append("tspan")
            .attr("y", 0)
            .attr("font-weight", "normal")
            .attr("dy", "22")
            .attr("dx", "50")
            .text(stairs.length);

        let color = d3.scaleOrdinal(d3.schemeSet1);
        qualities.forEach(function (d, i) {
            vis.append("tspan")
                .attr("y", 0)
                .attr("font-weight", "normal")
                .attr("dy", "22")
                .attr("dx", "22")
                .attr("fill", color(i))
                .text(parseFloat(d[1].toFixed(3)) + " (" + d[0] + ")");
        })

        vis.append("tspan")
            .attr("x", 0)
            .attr("font-weight", "bold")
            .attr("dy", "22")
            .text("# Escalators");
        vis.append("tspan")
            .attr("y", 0)
            .attr("font-weight", "normal")
            .attr("dy", "44")
            .attr("dx", "19")
            .text(escalators.length);
    }
}

function changeNodeEncodingBF(encoding) {
    bfNodeEncoding = encoding;
}

function changeEdgeEncodingBF(encoding) {
    bfEdgeEncoding = encoding;
}

function changeSelectedNodeAttributeBF(attr) {
    bfNodeAttribute = attr;
}

function changeSelectedEdgeAttributeBF(attr) {
    bfEdgeAttribute = attr;
}

function changeSelectedNodeOrderingBF(attr) {
    bfNodeOrdering = attr;
}

function changeSelectedEdgeOrderingBF(attr) {
    if (attr === "Index of Nodes") { attr = "nodes"}
    bfEdgeOrdering = attr;
}

function switchDoubleEdgesBF(bool) {
    bfDoubleEdges = bool;
}

function switchStairsBF(bool) {
    bfStairs = bool;
    if (bool) {
        let color = d3.scaleOrdinal(d3.schemeSet1);
        stairs.forEach(function (stair, i) {
            stair.forEach(d => d3.selectAll("#bf .edges g").filter(x => x.target === d.target && x.source === d.source)
                .select(".background")
                .attr("fill", color(i))
                .attr("fill-opacity", 0.3))
        })
    } else {
        d3.selectAll("#bf .edges g .background").attr("fill-opacity", 0);
        if (bfEscalators) {switchEscalatorsBF(bfEscalators);}
    }
}

function switchEscalatorsBF(bool) {
    bfEscalators = bool;
    if (bool) {
        let color = d3.scaleOrdinal(d3.schemeSet2);
        escalators.forEach(function (escalator, i) {
            escalator.forEach(d => d3.selectAll("#bf .edges g").filter(x => x.target === d.target && x.source === d.source)
                .select(".background")
                .attr("fill", color(i))
                .attr("fill-opacity", 0.3))
        })
    } else {
        d3.selectAll("#bf .edges g .background").attr("fill-opacity", 0);
        if (bfStairs) {switchStairsBF(bfStairs);}
    }
}