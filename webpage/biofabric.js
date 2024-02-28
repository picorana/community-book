// Visualization of the BioFabric

/**
 * This function appends the visualization of the network data in a BioFabric to the given g element.
 * The visualization is scaled to the provided width and height of the visualization space.
 * Possibilities for additional parameters of the encoding technique are described below:
 * @param g
 * @param width of the visualization space
 * @param height of the visualization space
 * @param data of network
 * @param nodeEncoding [plainNodes | coloredCircles | barsOnNodes | coloredLines | parallelLines | barsOnLines | juxtaposedNodes]
 * @param edgeEncoding [plainEdges | parallelEdges | barsOnEdges | juxtaposedEdges | parallelAndJuxtaposed | barsAndJuxtaposed]
 * @param nodeOrdering [Alphabetical | Mean | Edge Count | any node attribute]
 * @param edgeOrdering [Nodes | Mean | any ede attribute]
 * @param attribute any node attribute for encoding
 */
function bioFabric(g, width, height, data, nodeEncoding, edgeEncoding, nodeOrdering, edgeOrdering, attribute) {
    let network = JSON.parse(JSON.stringify(data));

    // get node and edge categories
    const nodeAttributes = getAttributeLabels(network.nodes);
    const edgeAttributes = getAttributeLabels(network.edges);

    if (!nodeAttributes.length) {
        nodeEncoding = "plainNodes";
    }
    if (!edgeAttributes.length) {
        edgeEncoding = "plainEdges";
    }

    // define size properties
    const widthForEdges = nodeEncoding === "juxtaposedNodes" ? 0.6 * width : width - 40;

    const nodeDistance = Math.min(100, (["juxtaposedEdges", "parallelAndJuxtaposed", "barsAndJuxtaposed"].includes(edgeEncoding) ? 0.6 * height : height - 40) / network.nodes.length);
    const nodeBarWidth = (0.4 * width - 60) / nodeAttributes.length - 10;
    const nodeBarDistance = nodeBarWidth + 10;
    const nodeBarHeight = Math.min(10, nodeDistance / 4);
    const min_nodeRadius = nodeDistance * 0.2;
    const max_nodeRadius = nodeDistance * 0.4;
    const nodeSize = nodeDistance * 0.9;
    const inNodeBarHeight = 0.6 * nodeSize;
    const inNodeBarWidth = nodeSize / nodeAttributes.length - 2;
    const inNodeBarDistance = inNodeBarWidth + 2;
    const min_nodeWidth = Math.max(1, Math.min(5, (nodeDistance * 0.0625 / (nodeEncoding === "parallelLines" ? (nodeAttributes.length - 2) :
        1))));
    const max_nodeWidth = Math.max(1, Math.min(10, (nodeDistance * 0.125 / (nodeEncoding === "parallelLines" ? (nodeAttributes.length - 2) :
        1))));
    const onNodeSpace = 0.1 * widthForEdges;
    const onNodeBarHeight = Math.max(1, Math.min(30, nodeDistance * 0.8));
    const onNodeBarWidth = Math.max(1, Math.min(10, onNodeSpace / nodeAttributes.length - 2));
    const onNodeBarDistance = onNodeBarWidth + 2;

    const squareSize = nodeDistance * 0.25;
    const min_edgeWidth = Math.max(1, Math.min(5, (widthForEdges - 30) / network.edges.length / edgeAttributes.length - 2));
    const max_edgeWidth = Math.max(1, Math.min(10, (widthForEdges - 30) / network.edges.length / edgeAttributes.length - 2));
    const onEdgeBarHeight = Math.min(20, widthForEdges / network.edges.length - 2);
    const onEdgeBarWidth = Math.min(10, (nodeDistance - squareSize) / edgeAttributes.length - 2);
    const onEdgeBarDistance = onEdgeBarWidth + 2;
    const edgeBarWidth = (0.4 * height - 40) / edgeAttributes.length - 10;
    const edgeBarDistance = edgeBarWidth + 10;
    const edgeBarHeight = Math.min(10, widthForEdges / network.edges.length / 2);

    const nameLength = Math.max(...network.nodes.map(n => n.name.length));
    const fontSize = Math.min(nameLength < 10 ? 20 : 10, nameLength < 10 ? nodeDistance * 0.5 : nodeDistance * 0.4);
    const smallFontSize = Math.min(nameLength < 10 ? 10 : 5, nodeSize * 0.25);
    const categoriesFontSize = 10;

    // define scales on each attribute
    const nodeRadiusScales = defineScales(nodeAttributes, network.nodes, min_nodeRadius, max_nodeRadius);
    const nodeBarScales = defineScales(nodeAttributes, network.nodes, 1, nodeBarWidth);
    const nodeWidthScales = defineScales(nodeAttributes, network.nodes, min_nodeWidth, max_nodeWidth);
    const inNodeBarScales = defineScales(nodeAttributes, network.nodes, 1, inNodeBarHeight);
    const onNodeBarScales = defineScales(nodeAttributes, network.nodes, 1, onNodeBarHeight);
    const nodeColors = d3.scaleOrdinal(d3.schemeSet1).domain(nodeAttributes);

    const edgeWidthScales = defineScales(edgeAttributes, network.edges, min_edgeWidth, max_edgeWidth);
    const onEdgeBarScales = defineScales(edgeAttributes, network.edges, 1, onEdgeBarHeight);
    const edgeBarScales = defineScales(edgeAttributes, network.edges, 1, edgeBarWidth);
    const edgeColors = d3.scaleOrdinal(d3.schemeSet2).domain(edgeAttributes);

    // apply node and edge ordering
    switch (nodeOrdering) {
        case "Alphabetical" :
            sortAlphabetically(network.nodes);
            break;
        case "Mean" :
            sortByMean(network.nodes);
            break;
        case "Edge Count" :
            sortByEdgeCount(network.nodes, network.edges);
            break;
        default :
            if (nodeAttributes.includes(nodeOrdering)) {
                sortByAttribute(nodeOrdering, network.nodes);
            }
            break;
    }

    switch (edgeOrdering) {
        case "Nodes" :
            sortByNodes(network.nodes, network.edges);
            break;
        case "Mean" :
            sortByMean(network.edges);
            break;
        default :
            if (edgeAttributes.includes(edgeOrdering)) {
                sortByAttribute(edgeOrdering, network.edges);
            }
            break;
    }

    // define node and edge positions
    const nodePositions = function (id) {
        return network.nodes.map(n => n.id).indexOf(id) * nodeDistance;
    };

    const edgePositions = d3.scaleLinear()
        .domain([0, network.edges.length - 1])
        .range([nodeEncoding === "barsOnLines" ? onNodeSpace : 0, widthForEdges - 30]);

    // append node lines
    const node = g.append("g")
        .attr("class", "BFNodes")
        .attr("transform", "translate(40, 40)")
        .selectAll("g")
        .data(network.nodes)
        .enter().append("g");

    node.append("line")
        .attr("y1", function (d) {
            return nodePositions(d.id);
        })
        .attr("x2", widthForEdges)
        .attr("y2", function (d) {
            return nodePositions(d.id);
        })
        .style("fill", "none")
        .style("stroke", "gray");

    // apply encoding of node attributes
    switch (nodeEncoding) {
        case "plainNodes":
            plainNodes();
            break;
        case "coloredCircles":
            coloredNodeCircles(attribute);
            break;
        case "barsOnNodes" :
            barsOnNodes();
            break;
        case "coloredLines":
            coloredNodeLines(attribute);
            break;
        case "parallelLines":
            parallelNodeLines();
            break;
        case "barsOnLines":
            barsOnNodeLines();
            break;
        case "juxtaposedNodes":
            juxtaposedNodeAttributes();
            break;
    }

    // apply encoding of edge attributes
    switch (edgeEncoding) {
        case "plainEdges":
            plainEdges();
            break;
        case "parallelEdges":
            parallelEdges();
            break;
        case "barsOnEdges":
            barsOnEdges();
            break;
        case "juxtaposedEdges":
            plainEdges();
            juxtaposedEdgeAttributes();
            break;
        case "parallelAndJuxtaposed":
            parallelEdges();
            juxtaposedEdgeAttributes();
            break;
        case "barsAndJuxtaposed":
            barsOnEdges();
            juxtaposedEdgeAttributes();
            break;
    }

    // highlighting of nodes and edges
    d3.selectAll(".BFNodes,.BFAttributes").selectAll("g").on("mouseover", function (_, d) {
        d3.select(this).selectAll("line").attr("stroke-width", "2px");
        d3.select(this).selectAll("rect,circle").attr("stroke", "black")
            .attr("stroke-width", "2px");
        d3.selectAll(".BFNodes").selectAll("g").filter(n => n !== d).selectAll("line").attr("stroke-opacity", 0.5);
        d3.selectAll(".BFAttributes").selectAll("g").filter(n => n !== d).selectAll(".BFBase").style("stroke-opacity", 0.25);
        d3.selectAll(".BFAttributes").selectAll("g").filter(n => n !== d).selectAll(".BFAttribute").attr("stroke-opacity", 0.5);
    }).on("mouseout", function () {
        d3.select(this).selectAll("line").attr("stroke-width", "1px");
        d3.select(this).selectAll("rect,circle").attr("stroke", null);
        d3.selectAll(".BFNodes").selectAll("g").selectAll("line").attr("stroke-opacity", 1);
        d3.selectAll(".BFAttributes").selectAll("g").selectAll(".BFBase").style("stroke-opacity", 0.5);
        d3.selectAll(".BFAttributes").selectAll("g").selectAll(".BFAttribute").attr("stroke-opacity", 1);
    });

    d3.selectAll(".BFEdges,.BFEdgeAttributes").selectAll("g").on("mouseover", function (_, d) {
        d3.select(this).selectAll("line").attr("stroke-width", "2px");
        d3.selectAll(".BFEdges").selectAll("g").filter(e => e !== d).selectAll("line").attr("stroke-opacity", 0.5);
        d3.selectAll(".BFEdges").selectAll("g").filter(e => e !== d).selectAll("rect").attr("opacity", 0.5);
        d3.selectAll(".BFEdgeAttributes").selectAll("g").filter(e => e !== d).selectAll(".BFBase").style("stroke-opacity", 0.25);
        d3.selectAll(".BFEdgeAttributes").selectAll("g").filter(e => e !== d).selectAll(".BFAttribute").attr("stroke-opacity", 0.5);
    }).on("mouseout", function (_, d) {
        d3.select(this).selectAll("line").attr("stroke-width", "1px");
        d3.selectAll(".BFEdges").selectAll("g").filter(e => e !== d).selectAll("line").attr("stroke-opacity", 1);
        d3.selectAll(".BFEdges").selectAll("g").filter(e => e !== d).selectAll("rect").attr("opacity", 1);
        d3.selectAll(".BFEdgeAttributes").selectAll("g").filter(e => e !== d).selectAll(".BFBase").style("stroke-opacity", 0.5);
        d3.selectAll(".BFEdgeAttributes").selectAll("g").filter(e => e !== d).selectAll(".BFAttribute").attr("stroke-opacity", 1);
    });

    /**
     * This function appends the name of a node without encoding an attribute.
     */
    function plainNodes() {
        node.append("text")
            .attr("transform", function (d) {
                return "translate(-5," + nodePositions(d.id) + ")" + (nameLength < 10 ? "" : "rotate(-45)");
            })
            .text(function (d) {
                return d.name;
            })
            .attr("dy", ".35em")
            .style("fill", "black")
            .style("text-anchor", "end")
            .style("font-size", fontSize);
    }

    /**
     * This function encodes one given node attribute by mapping the value to the radius of a circle filled in corresponding hue.
     * Nodes that do not share this attribute remain plain.
     * @param attr
     */
    function coloredNodeCircles(attr) {
        node.append("circle")
            .attr("transform", function (d) {
                return "translate(-" + max_nodeRadius + "," + nodePositions(d.id) + ")";
            })
            .attr("r", function (d) {
                return attr in d.attributes ? nodeRadiusScales[attr](d.attributes[attr]) : min_nodeRadius;
            })
            .style("fill", function (d) {
                return attr in d.attributes ? nodeColors(attr) : "#e9ecef";
            });

        node.append("text")
            .attr("transform", function (d) {
                return "translate(-" + max_nodeRadius + "," + nodePositions(d.id) + ")";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill", "black")
            .style("font-size", smallFontSize)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle");
    }


    /**
     * This function encodes the node attributes in a bar chart.
     */
    function barsOnNodes() {
        node.append("rect")
            .attr("class", "nodeBarChart")
            .attr("width", nodeSize)
            .attr("height", nodeSize)
            .attr("x", -nodeSize / 2)
            .attr("y", -nodeSize / 2)
            .style("fill", "#e9ecef");

        node.each(function (n) {
            for (let [i, attr] of Object.entries(nodeAttributes)) {
                if (attr in n.attributes) {
                    d3.select(this).append("line")
                        .attr("class", "nodeBarChart")
                        .attr("x1", inNodeBarDistance * i - nodeSize / 2 + inNodeBarWidth / 2 + 1)
                        .attr("y1", nodeSize / 2 - 2)
                        .attr("x2", inNodeBarDistance * i - nodeSize / 2 + inNodeBarWidth / 2 + 1)
                        .attr("y2", -inNodeBarScales[attr](n.attributes[attr]) + nodeSize / 2 - 2)
                        .style("stroke-opacity", 1)
                        .style("stroke-width", inNodeBarWidth)
                        .style("stroke", nodeColors(attr));
                }
            }
        });

        node.append("text")
            .attr("class", "nodeBarChart")
            .text(function (d) {
                return d.name;
            })
            .style("fill", "black")
            .style("font-size", smallFontSize)
            .attr("y", -nodeSize + inNodeBarHeight * 1.1)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle");

        d3.selectAll(".nodeBarChart")
            .attr("transform", function (d) {
                return "translate(-10 ," + nodePositions(d.id) + ")";
            });
    }

    /**
     * This function encodes one given node attribute by mapping the value to the width of the line filled in corresponding hue.
     * Nodes that do not share this attribute remain plain.
     * @param attr
     */
    function coloredNodeLines(attr) {
        plainNodes();
        node.selectAll("line")
            .style("stroke", function (d) {
                return attr in d.attributes ? nodeColors(attr) : "gray";
            })
            .style("stroke-width", function (d) {
                return attr in d.attributes ? nodeWidthScales[attr](d.attributes[attr]) : 1;
            });
    }

    /**
     * This function encodes each node attribute by a separate line.
     * These lines map the value to the width of the line filled in corresponding hue and are aligned in parallel.
     */
    function parallelNodeLines() {
        plainNodes();
        node.each(function (n) {
            for (let [i, [attr, value]] of Object.entries(Object.entries(n.attributes))) {
                let max = Object.keys(n.attributes).length - 1;
                d3.select(this).append("line")
                    .attr("y1", nodePositions(n.id))
                    .attr("x2", widthForEdges)
                    .attr("y2", nodePositions(n.id))
                    // shift edges up or down from the middle edge
                    .attr("transform", "translate(0, " + - (Math.round(max / 2 - i) * (max_nodeWidth + 2)) + ")")
                    .style("stroke-width", nodeWidthScales[attr](value))
                    .style("stroke", nodeColors(attr));
            }
        });
    }

    /**
     * This function encodes each node attribute by a bar on the node's line.
     */
    function barsOnNodeLines() {
        plainNodes();
        let max = nodeAttributes.length - 1;
        node.each(function (n) {
            for (let [i, attr] of Object.entries(nodeAttributes)) {
                if (attr in n.attributes) {
                    let y = nodePositions(n.id);
                    let mid_x = (0.1 * width) / 2 + 2;
                    let shift_x = - Math.round(max / 2 - i) * onNodeBarDistance;
                    d3.select(this).append("line")
                        .attr("x1", mid_x + shift_x)
                        .attr("y1", y)
                        .attr("x2", mid_x + shift_x)
                        .attr("y2", y - onNodeBarScales[attr](n.attributes[attr]))
                        .style("stroke-width", onNodeBarWidth)
                        .style("stroke", nodeColors(attr));
                }
            }
        });
    }

    /**
     * This function encodes the node attributes in a juxtaposed table aligned to the nodes.
     */
    function juxtaposedNodeAttributes() {
        plainNodes();

        // create background
        const background = g.append("g")
            .attr("class", "BFBackground")
            .attr("transform", "translate(" + (60 + widthForEdges) + ", 40)");

        nodeAttributes.forEach(function (d, i) {
            background.append("rect")
                .attr("width", nodeBarWidth + 4)
                .attr("height", (network.nodes.length - 0.5) * nodeDistance)
                .attr("x", nodeBarDistance * i - 2)
                .attr("y", -nodeDistance / 4)
                .style("fill", "#e9ecef");
        });

        network.nodes.forEach(function (d, i) {
            background.append("line")
                .attr("x1", -2)
                .attr("y1", nodeDistance * i)
                .attr("x2", nodeBarDistance * nodeAttributes.length)
                .attr("y2", nodeDistance * i)
                .style("stroke", "white");
        });

        g.append("g")
            .attr("class", "BFLabels")
            .attr("transform", "translate(" + (60 + widthForEdges) + ", 20)")
            .selectAll("text")
            .data(nodeAttributes)
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", function (d, i) {
                return nodeBarDistance * i + nodeBarWidth / 2;
            })
            .style("text-anchor", "middle")
            .style("font-size", categoriesFontSize);

        // append a table for representation of attributes
        const table = g.append("g")
            .attr("class", "BFAttributes")
            .attr("transform", "translate(" + (60 + widthForEdges) + ", 40)")
            .selectAll("g")
            .data(network.nodes)
            .enter().append("g");

        table.each(function (n) {
            for (let [j, attr] of Object.entries(nodeAttributes)) {
                if (attr in n.attributes) {
                    // add a base for the bars
                    d3.select(this).append("line")
                        .attr("class", "BFBase")
                        .attr("transform", "translate(" + (nodeBarDistance * j) + ", 0)")
                        .attr("y1", nodePositions(n.id))
                        .attr("x2", nodeBarWidth)
                        .attr("y2", nodePositions(n.id))
                        .style("stroke", nodeColors(attr))
                        .style("stroke-opacity", 0.5)
                        .style("stroke-width", nodeBarHeight);

                    // add bars encoding the numerical attribute
                    d3.select(this).append("line")
                        .attr("class", "BFAttribute")
                        .attr("transform", "translate(" + (nodeBarDistance * j) + ", 0)")
                        .attr("y1", nodePositions(n.id))
                        .attr("x2", nodeBarScales[attr](n.attributes[attr]))
                        .attr("y2", nodePositions(n.id))
                        .style("stroke", nodeColors(attr))
                        .style("stroke-width", nodeBarHeight);
                }
            }
        });
    }

    /**
     * This function creates edge lines without encoding an attribute. The source and target node are marked with a square on the corresponding line.
     */
    function plainEdges() {
        const edge = g.append("g")
            .attr("class", "BFEdges")
            .attr("transform", "translate(60, 40)")
            .selectAll("g")
            .data(network.edges)
            .enter().append("g");

        edge.append("line")
            .attr("x1", function (d, i) {
                return edgePositions(i);
            })
            .attr("y1", function (d) {
                return nodePositions(d.source);
            })
            .attr("x2", function (d, i) {
                return edgePositions(i);
            })
            .attr("y2", function (d) {
                return nodePositions(d.target);
            })
            .style("fill", "none")
            .style("stroke", "black");

        edge.append("rect")
            .attr("width", squareSize)
            .attr("height", function (d) {
                if (nodeEncoding === "parallelLines") {
                    let source = network.nodes.find(n => n.id === d.source);
                    return Math.max(Object.keys(source.attributes).length * (max_nodeWidth + 2), squareSize);
                } else {
                    return squareSize;
                }
            })
            .attr("x", function (d, i) {
                return edgePositions(i) - squareSize / 2;
            })
            .attr("y", function (d) {
                let source = network.nodes.find(n => n.id === d.source);
                let max = Object.keys(source.attributes).length;
                if (nodeEncoding === "parallelLines" && max * (max_nodeWidth + 2) > squareSize) {
                    if (max % 2 === 0) {
                        return nodePositions(d.source) - (max + 1) * (max_nodeWidth + 2) / 2;
                    } else {
                        return nodePositions(d.source) - max * (max_nodeWidth + 2) / 2;
                    }
                } else {
                    return nodePositions(d.source) - squareSize / 2;
                }
            })
            .style("fill", "black");

        edge.append("rect")
            .attr("width", squareSize)
            .attr("height", function (d) {
                if (nodeEncoding === "parallelLines") {
                    let target = network.nodes.find(n => n.id === d.target);
                    return Math.max(Object.keys(target.attributes).length * (max_nodeWidth + 2), squareSize);
                } else {
                    return squareSize;
                }
            })
            .attr("x", function (d, i) {
                return edgePositions(i) - squareSize / 2;
            })
            .attr("y", function (d) {
                let target = network.nodes.find(n => n.id === d.target);
                let max = Object.keys(target.attributes).length;
                if (nodeEncoding === "parallelLines" && max * (max_nodeWidth + 2) > squareSize) {
                    if (max % 2 === 0) {
                        return nodePositions(d.target) - (max + 1) * (max_nodeWidth + 2) / 2;
                    } else {
                        return nodePositions(d.target) - max * (max_nodeWidth + 2) / 2;
                    }
                } else {
                    return nodePositions(d.target) - squareSize / 2;
                }
            })
            .style("fill", "black");
    }

    /**
     * This function encodes each edge attribute by a separate line.
     * These lines map the value to the width of the line filled in corresponding hue and are aligned in parallel.
     */
    function parallelEdges() {
        const edge = g.append("g")
            .attr("class", "BFEdges")
            .attr("transform", "translate(60, 40)")
            .selectAll("g")
            .data(network.edges)
            .enter().append("g");

        edge.each(function (e, j) {
            for (let [i, [attr, value]] of Object.entries(Object.entries(e.attributes))) {
                let max = Object.keys(e.attributes).length - 1;
                d3.select(this).append("line")
                    .attr("x1", edgePositions(j))
                    .attr("y1", nodePositions(e.source))
                    .attr("x2", edgePositions(j))
                    .attr("y2", nodePositions(e.target))
                    // shift edges right or left from the middle edge
                    .attr("transform", "translate(" + - (Math.round(max / 2 - i) * (max_edgeWidth + 2)) + ", 0)")
                    .style("stroke-width", edgeWidthScales[attr](value))
                    .style("stroke", edgeColors(attr));
            }

            // visualize edges without attributes as plain edges
            if (!Object.keys(e.attributes).length) {
                d3.select(this).append("line")
                    .attr("x1", edgePositions(j))
                    .attr("y1", nodePositions(e.source))
                    .attr("x2", edgePositions(j))
                    .attr("y2", nodePositions(e.target))
                    .style("fill", "none")
                    .style("stroke", "black");
            }
        });

        edge.append("rect")
            .attr("width", function (d) {
                return Math.max(max_edgeWidth * Object.keys(d.attributes).length + (Object.keys(d.attributes).length - 1) * 2, squareSize);
            })
            .attr("height", function (d) {
                if (nodeEncoding === "parallelLines") {
                    let source = network.nodes.find(n => n.id === d.source);
                    return Math.max(Object.keys(source.attributes).length * (max_nodeWidth + 2) - max_nodeWidth / 2, squareSize);
                } else {
                    return squareSize;
                }
            })
            .attr("x", function (d, i) {
                if (!Object.keys(d.attributes).length) {
                    return edgePositions(i) - squareSize / 2;
                } else  {
                    return edgePositions(i) - 0.5 * max_edgeWidth - Math.round((Object.keys(d.attributes).length - 1) / 2) * (max_edgeWidth + 2);
                }
            })
            .attr("y", function (d) {
                let source = network.nodes.find(n => n.id === d.source);
                let max = Object.keys(source.attributes).length;
                if (nodeEncoding === "parallelLines" && max * (max_nodeWidth + 2) > squareSize) {
                    if (max % 2 === 0) {
                        return nodePositions(d.source) - (max + 1) * (max_nodeWidth + 2) / 2;
                    } else {
                        return nodePositions(d.source) - max * (max_nodeWidth + 2) / 2;
                    }
                } else {
                    return nodePositions(d.source) - squareSize / 2;
                }
            })
            .style("fill", "black");

        edge.append("rect")
            .attr("width", function (d) {
                return Math.max(max_edgeWidth * Object.keys(d.attributes).length + (Object.keys(d.attributes).length - 1) * 2, squareSize);
            })
            .attr("height", function (d) {
                if (nodeEncoding === "parallelLines") {
                    let target = network.nodes.find(n => n.id === d.target);
                    return Math.max(Object.keys(target.attributes).length * (max_nodeWidth + 2) - max_nodeWidth / 2, squareSize);
                } else {
                    return squareSize;
                }
            })
            .attr("x", function (d, i) {
                if (!Object.keys(d.attributes).length) {
                    return edgePositions(i) - squareSize / 2;
                } else  {
                    return edgePositions(i) - 0.5 * max_edgeWidth - Math.round((Object.keys(d.attributes).length - 1) / 2) * (max_edgeWidth + 2);
                }
            })
            .attr("y", function (d) {
                let target = network.nodes.find(n => n.id === d.target);
                let max = Object.keys(target.attributes).length;
                if (nodeEncoding === "parallelLines" && max * (max_nodeWidth + 2) > squareSize) {
                    if (max % 2 === 0) {
                        return nodePositions(d.target) - (max + 1) * (max_nodeWidth + 2) / 2;
                    } else {
                        return nodePositions(d.target) - max * (max_nodeWidth + 2) / 2;
                    }
                } else {
                    return nodePositions(d.target) - squareSize / 2;
                }
            })
            .style("fill", "black");
    }

    /**
     * This function encodes the edge attributes using bars. These are represented beside each other on a common baseline.
     * The numerical values are mapped to the height of the bars which are filled in the corresponding hue.
     */
    function barsOnEdges() {
        plainEdges();
        let max = edgeAttributes.length - 1;
        g.selectAll(".BFEdges").selectAll("g").each(function (e, j) {
            for (let [i, attr] of Object.entries(edgeAttributes)) {
                if (attr in e.attributes) {
                    let x = edgePositions(j);
                    let mid_y = (nodePositions(e.source) + nodePositions(e.target)) / 2;
                    let shift_y = - Math.round(max / 2 - i) * onEdgeBarDistance;
                    d3.select(this).append("line")
                        .attr("x1", x)
                        .attr("y1", mid_y + shift_y)
                        .attr("x2", x + onEdgeBarScales[attr](e.attributes[attr]))
                        .attr("y2", mid_y + shift_y)
                        .style("stroke-width", onEdgeBarWidth)
                        .style("stroke", edgeColors(attr));
                }
            }
        });
    }

    /**
     * This function encodes the edge attributes in a juxtaposed table aligned to the edge lines.
     */
    function juxtaposedEdgeAttributes() {
        // create background
        const background = g.append("g")
            .attr("class", "BFBackground")
            .attr("transform", "translate(40, " + (network.nodes.length * nodeDistance + 40) + ")");

        edgeAttributes.forEach(function (d, i) {
            background.append("rect")
                .attr("width", widthForEdges)
                .attr("height", edgeBarWidth + 4)
                .attr("y", edgeBarDistance * i - 2)
                .style("fill", "#e9ecef");
        });

        network.edges.forEach(function (d, i) {
            background.append("line")
                .attr("transform", "translate(20, 0)")
                .attr("x1", edgePositions(i))
                .attr("y1", -2)
                .attr("x2", edgePositions(i))
                .attr("y2", edgeBarDistance * edgeAttributes.length)
                .style("stroke", "white");
        });

        g.append("g")
            .attr("class", "BFLabels")
            .attr("transform", "translate(30, " + (network.nodes.length * nodeDistance + 40) + ")")
            .selectAll("text")
            .data(edgeAttributes)
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("transform", function (d, i) {
                return "translate(0, " + (edgeBarDistance * i + edgeBarWidth / 2) + ")" + (nameLength < 10 ? "" : "rotate(-45)");
            })
            .style("text-anchor", "end")
            .style("font-size", categoriesFontSize);

        // append a table for representation of attributes
        const table = g.append("g")
            .attr("class", "BFEdgeAttributes")
            .attr("transform", "translate(60, " + (network.nodes.length * nodeDistance + 40) + ")")
            .selectAll("g")
            .data(network.edges)
            .enter().append("g");

        table.each(function (e) {
            for (let [j, attr] of Object.entries(edgeAttributes)) {
                if (attr in e.attributes) {
                    // add a base for the bars
                    d3.select(this).append("line")
                        .attr("class", "BFBase")
                        .attr("transform", "translate(0, " + (edgeBarDistance * j) + ")")
                        .attr("x1", edgePositions(network.edges.indexOf(e)))
                        .attr("y2", edgeBarWidth)
                        .attr("x2", edgePositions(network.edges.indexOf(e)))
                        .style("stroke", edgeColors(attr))
                        .style("stroke-opacity", 0.5)
                        .style("stroke-width", edgeBarHeight);

                    // add bars encoding the numerical attribute
                    d3.select(this).append("line")
                        .attr("class", "BFAttribute")
                        .attr("transform", "translate(0, " + (edgeBarDistance * j) + ")")
                        .attr("x1", edgePositions(network.edges.indexOf(e)))
                        .attr("y2", edgeBarScales[attr](e.attributes[attr]))
                        .attr("x2", edgePositions(network.edges.indexOf(e)))
                        .style("stroke", edgeColors(attr))
                        .style("stroke-width", edgeBarHeight);
                }
            }
        });
    }
}