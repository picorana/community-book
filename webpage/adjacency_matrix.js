// Visualization of the adjacency matrix

/**
 * This function appends the visualization of the network data in an adjacency matrix to the given g element.
 * The visualization is scaled to the provided width and height of the visualization space.
 * Possibilities for additional parameters of the encoding technique are described below:
 * @param g
 * @param width of the visualization space
 * @param height of the visualization space
 * @param data of network
 * @param nodeEncoding [plainNodes | coloredNodes | juxtaposedNodes]
 * @param edgeEncoding [plainEdges | coloredEdges | multipleEdges]
 * @param ordering of nodes, [Alphabetical | Mean | Edge Count | any node attribute]
 * @param nodeAttribute any node attribute for encoding
 * @param edgeAttribute any edge attribute for encoding
 */
function adjacencyMatrix(g, width, height, data, nodeEncoding, edgeEncoding, ordering, nodeAttribute, edgeAttribute) {
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
    const cellSize = nodeEncoding === "juxtaposedNodes" ? 0.6 * Math.min(height, width) / (network.nodes.length + 1) :
        Math.min(height / (network.nodes.length + 1), width / (network.nodes.length + 1), 50);

    const nodeBarWidth = (width - (network.nodes.length + 2) * cellSize - 10 * nodeAttributes.length) / nodeAttributes.length;
    const nodeBarDistance = nodeBarWidth + 10;
    const nodeBarHeight = 0.2 * cellSize;

    const edgeBarWidth = cellSize / edgeAttributes.length;

    const max_nameLength = Math.max(...network.nodes.map(n => n.name.length));
    const fontSize = Math.min(max_nameLength < 10 ? 20 : 10, max_nameLength < 10 ? cellSize * 0.5 : cellSize * 0.25);

    // define scales on each attribute
    const nodeBarScales = defineScales(nodeAttributes, network.nodes, 1, nodeBarWidth);
    const nodeOpacityScales = defineScales(nodeAttributes, network.nodes, 0.5, 1);
    const nodeColors = d3.scaleOrdinal(d3.schemeSet1).domain(nodeAttributes);

    const edgeSquareScales = defineScales(edgeAttributes, network.edges, 2, cellSize);
    const edgeBarScales = defineScales(edgeAttributes, network.edges, 1, cellSize);
    const edgeOpacityScales = defineScales(edgeAttributes, network.edges, 0.5, 1);
    const edgeColors = d3.scaleOrdinal(d3.schemeSet2).domain(edgeAttributes);


    // apply node ordering
    switch (ordering) {
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
            if (nodeAttributes.includes(ordering)) {
                sortByAttribute(ordering, network.nodes);
            }
            break;
    }

    // define node positions
    const nodePositions = {};
    network.nodes.forEach(function (d, i) {
        nodePositions[d.id] = cellSize * i;
    });

    // append nodes to left header
    const leftNode = g.append("g")
        .attr("class", "ADMNodes")
        .attr("transform", "translate(0, " + cellSize + ")")
        .selectAll("g")
        .data(network.nodes)
        .enter().append("g");

    leftNode.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("y", function (d, i) {
            return cellSize * i;
        })
        .style("fill", "#e9ecef")
        .style("stroke", "black")
        .style("stroke-width", "2px");

    leftNode.append("text")
        .attr("transform", function (d, i) {
            return "translate(" + (cellSize / 2) + ", " + (cellSize * i + cellSize / 2) + ")" + (max_nameLength < 10 ? "" : "rotate(-45)");
        })
        .text(function (d) {
            return d.name;
        })
        .attr("dy", ".35em")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", fontSize);

    // append nodes to upper header
    const upperNode = g.append("g")
        .attr("class", "ADMNodes")
        .attr("transform", "translate(" + cellSize + ", 0)")
        .selectAll("g")
        .data(network.nodes)
        .enter().append("g");

    upperNode.append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function (d, i) {
            return cellSize * i;
        })
        .style("fill", "#e9ecef")
        .style("stroke", "black")
        .style("stroke-width", "2px");

    upperNode.append("text")
        .attr("transform", function (d, i) {
            return "translate(" + (cellSize * i + cellSize / 2) + ", " + (cellSize / 2) + ")" + (max_nameLength < 10 ? "" : "rotate(-45)");
        })
        .text(function (d) {
            return d.name;
        })
        .attr("dy", ".35em")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", fontSize);

    // apply encoding of node attributes
    switch (nodeEncoding) {
        case "plainNodes":
            break;
        case "coloredNodes":
            coloredNodes(nodeAttribute);
            break;
        case "juxtaposedNodes":
            juxtaposedNodeAttributes();
            break;
    }

    // append edges
    const edge = g.append("g")
        .attr("class", "ADMEdges")
        .attr("transform", "translate(" + cellSize + ", " + cellSize + ")")
        .selectAll("g")
        .data(network.edges)
        .enter()
        .append("g");

    // apply encoding of edge attributes
    switch (edgeEncoding) {
        case "plainEdges":
            plainEdges();
            break;
        case "squaredEdges":
            oneEdgeAttribute(edgeAttribute);
            break;
        case "multipleEdges":
            if (edgeAttributes.length === 1) {
                oneEdgeAttribute(edgeAttribute);
            } else if (edgeAttributes.length === 2) {
                twoEdgeAttributes();
            } else {
                multipleEdgeAttributes();
            }
            break;
    }

    // highlighting of nodes and edges
    d3.selectAll(".ADMNodes,.ADMAttributes").selectAll("g").on("mouseover", function (_, d) {
        d3.selectAll(".ADMNodes").selectAll("g").filter(n => n === d).selectAll("rect").raise().style("stroke-width", "4px");
        d3.selectAll(".ADMNodes").selectAll("g").filter(n => n === d).selectAll("text").raise();
        d3.selectAll(".ADMAttributes").selectAll("g").filter(n => n !== d).selectAll(".ADMBase").style("stroke-opacity", 0.25);
        d3.selectAll(".ADMAttributes").selectAll("g").filter(n => n !== d).selectAll(".ADMAttribute").attr("stroke-opacity", 0.5);
    }).on("mouseout", function () {
        d3.selectAll(".ADMNodes").selectAll("rect").style("stroke-width", "2px");
        d3.selectAll(".ADMAttributes").selectAll("g").selectAll(".ADMBase").style("stroke-opacity", 0.5);
        d3.selectAll(".ADMAttributes").selectAll("g").selectAll(".ADMAttribute").attr("stroke-opacity", 1);
    });

    d3.selectAll(".ADMEdges").selectAll("g").on("mouseover", function (_, d) {
        d3.selectAll(".ADMEdges").selectAll("g").selectAll("rect").filter(e => e !== d).attr("opacity", 0.5);
        d3.selectAll(".ADMEdges").selectAll("g").selectAll("rect").filter(e => e !== d).selectAll(".ADMBase").style("opacity", 0.25);
    }).on("mouseout", function () {
        d3.selectAll(".ADMEdges").selectAll("g").selectAll("rect").attr("opacity", 1);
        d3.selectAll(".ADMEdges").selectAll("g").selectAll(".ADMBase").style("opacity", 0.5);
    });

    /**
     * This function colors nodes based on the given attribute. Nodes that do not share this attribute remain plain.
     * The attribute value is encoded using opacity.
     * @param attr
     */
    function coloredNodes(attr) {
        d3.selectAll(".ADMNodes").selectAll("g").selectAll("rect")
            .style("fill", function (d) {
                return attr in d.attributes ? nodeColors(attr) : "#e9ecef";
            })
            .style("fill-opacity", function (d) {
                return attr in d.attributes ? nodeOpacityScales[attr](d.attributes[attr]) : 1;
            });
    }

    /**
     * This function encodes the node attributes in a juxtaposed table aligned to the left nodes.
     */
    function juxtaposedNodeAttributes() {
        // create background
        const background = g.append("g")
            .attr("class", "ADMBackground")
            .attr("transform", "translate(" + ((network.nodes.length + 2) * cellSize) + ", " + cellSize + ")");

        nodeAttributes.forEach(function (d, i) {
            background.append("rect")
                .attr("width", nodeBarWidth + 4)
                .attr("height", network.nodes.length * cellSize)
                .attr("x", nodeBarDistance * i - 2)
                .style("fill", "#e9ecef");
        });

        network.nodes.forEach(function (d, i) {
            background.append("line")
                .attr("x1", -2)
                .attr("y1", cellSize * i)
                .attr("x2", nodeBarDistance * nodeAttributes.length)
                .attr("y2", cellSize * i)
                .style("stroke", "white");
        });

        g.append("g")
            .attr("class", "ADMLabels")
            .attr("transform", "translate(" + ((network.nodes.length + 2) * cellSize) + ", " + (cellSize / 2) + ")")
            .selectAll("text")
            .data(nodeAttributes)
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", function (d, i) {
                return nodeBarDistance * (i + 0.5) - 10;
            })
            .style("text-anchor", "middle")
            .style("font-size", fontSize);

        // append a table for representation of attributes
        const table = g.append("g")
            .attr("class", "ADMAttributes")
            .attr("transform", "translate(" + ((network.nodes.length + 2) * cellSize) + ", " + cellSize + ")")
            .selectAll("g")
            .data(network.nodes)
            .enter().append("g");

        table.each(function (n, i) {
            for (let [j, attr] of Object.entries(nodeAttributes)) {
                if (attr in n.attributes) {
                    // add a base for the bars
                    d3.select(this).append("line")
                        .attr("transform", "translate(" + (nodeBarDistance * j) + ", 0)")
                        .attr("class", "ADMBase")
                        .attr("x1", 0)
                        .attr("y1", i * cellSize + cellSize / 2)
                        .attr("x2", nodeBarWidth)
                        .attr("y2", i * cellSize + cellSize / 2)
                        .style("stroke-opacity", 0.5)
                        .style("stroke-width", nodeBarHeight)
                        .style("stroke", nodeColors(attr));

                    // add bars encoding the numerical attribute
                    d3.select(this).append("line")
                        .attr("transform", "translate(" + (nodeBarDistance * j) + ", 0)")
                        .attr("class", "ADMAttribute")
                        .attr("x1", 0)
                        .attr("y1", i * cellSize + cellSize / 2)
                        .attr("x2", nodeBarScales[attr](n.attributes[attr]))
                        .attr("y2", i * cellSize + cellSize / 2)
                        .style("stroke-width", nodeBarHeight)
                        .style("stroke", nodeColors(attr));
                }
            }
        });
    }

    /**
     * This function fills the edge cells without encoding an attribute.
     */
    function plainEdges() {
        edge.append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d) {
                return nodePositions[d.source];
            })
            .attr("y", function (d) {
                return nodePositions[d.target];
            })
            .style("fill", "gray");

        // repeat with swapped source and target
        edge.append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d) {
                return nodePositions[d.target];
            })
            .attr("y", function (d) {
                return nodePositions[d.source];
            })
            .style("fill", "gray");
    }

    /**
     * This function encodes one given edge attribute by mapping the value to the size of the square filled in corresponding hue.
     * Nodes that do not share this attribute remain plain.
     * @param attr
     */
    function oneEdgeAttribute(attr) {
        plainEdges();
        edge.selectAll("rect")
            .attr("width", function (d) {
                return attr in d.attributes ? edgeSquareScales[attr](d.attributes[attr]) : cellSize;
            })
            .attr("height", function (d) {
                return attr in d.attributes ? edgeSquareScales[attr](d.attributes[attr]) : cellSize;
            })
            .attr("transform", function (d) {
                return attr in d.attributes ? "translate(" + (cellSize / 2 - edgeSquareScales[attr](d.attributes[attr]) / 2) + ", "
                    + (cellSize / 2 - edgeSquareScales[attr](d.attributes[attr]) / 2) + ")" : "translate(0, 0)";
            })
            .style("fill", function (d) {
                return attr in d.attributes ? edgeColors(attr) : "gray";
            });
    }

    /**
     * This function divides the cell into inner and outer square to encode two attributes.
     * The space is filled by differentiating hue and the attribute value is encoded by opacity.
     */
    function twoEdgeAttributes() {
        // encode first attribute in outer space
        let first = edgeAttributes[0]
        edge.append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d) {
                return nodePositions[d.source];
            })
            .attr("y", function (d) {
                return nodePositions[d.target];
            })
            .style("fill", edgeColors(first))
            .style("fill-opacity", function (d) {
                return first in d.attributes ? edgeOpacityScales[first](d.attributes[first]) : 0;
            });

        edge.append("rect")
            .attr("width", cellSize / 2)
            .attr("height", cellSize / 2)
            .attr("x", function (d) {
                return nodePositions[d.source] + cellSize / 4;
            })
            .attr("y", function (d) {
                return nodePositions[d.target] + cellSize / 4;
            })
            .style("fill", "white");

        // encode second attribute in inner space
        let second = edgeAttributes[1]
        edge.append("rect")
            .attr("width", cellSize / 2)
            .attr("height", cellSize / 2)
            .attr("x", function (d) {
                return nodePositions[d.source] + cellSize / 4;
            })
            .attr("y", function (d) {
                return nodePositions[d.target] + cellSize / 4;
            })
            .style("fill", edgeColors(second))
            .style("fill-opacity", function (d) {
                return second in d.attributes ? edgeOpacityScales[second](d.attributes[second]) : 0;
            });

        // repeat with swapped source and target
        edge.append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function (d) {
                return nodePositions[d.target];
            })
            .attr("y", function (d) {
                return nodePositions[d.source];
            })
            .style("fill", edgeColors(first))
            .style("fill-opacity", function (d) {
                return first in d.attributes ? edgeOpacityScales[first](d.attributes[first]) : 0;
            });

        edge.append("rect")
            .attr("width", cellSize / 2)
            .attr("height", cellSize / 2)
            .attr("x", function (d) {
                return nodePositions[d.target] + cellSize / 4;
            })
            .attr("y", function (d) {
                return nodePositions[d.source] + cellSize / 4;
            })
            .style("fill", "white");

        edge.append("rect")
            .attr("width", cellSize / 2)
            .attr("height", cellSize / 2)
            .attr("x", function (d) {
                return nodePositions[d.target] + cellSize / 4;
            })
            .attr("y", function (d) {
                return nodePositions[d.source] + cellSize / 4;
            })
            .style("fill", edgeColors(second))
            .style("fill-opacity", function (d) {
                return second in d.attributes ? edgeOpacityScales[second](d.attributes[second]) : 0;
            });
    }

    /**
     * This function encodes multiple edge attribute in a bar chart. Existing edge attributes are emphasised by a base of low opacity behind the actual bar.
     */
    function multipleEdgeAttributes() {
        edge.each(function (e) {
            for (let [i, attr] of Object.entries(edgeAttributes)) {
                if (attr in e.attributes) {
                    d3.select(this).append("rect")
                        .attr("class", "ADMEdgeBase")
                        .attr("width", edgeBarWidth)
                        .attr("height", cellSize)
                        .attr("x", function (d) {
                            return nodePositions[d.source] + i * edgeBarWidth;
                        })
                        .attr("y", function (d) {
                            return nodePositions[d.target];
                        })
                        .style("fill", edgeColors(attr))
                        .style("fill-opacity", 0.3);

                    d3.select(this).append("rect")
                        .attr("class", "ADMEdgeAttribute")
                        .attr("width", edgeBarWidth)
                        .attr("height", function (d) {
                            return edgeBarScales[attr](d.attributes[attr]);
                        })
                        .attr("x", function (d) {
                            return nodePositions[d.source] + i * edgeBarWidth;
                        })
                        .attr("y", function (d) {
                            return (nodePositions[d.target] + cellSize) - edgeBarScales[attr](d.attributes[attr]);
                        })
                        .style("fill", edgeColors(attr));

                    // repeat with swapped source and target
                    d3.select(this).append("rect")
                        .attr("class", "ADMEdgeBase")
                        .attr("width", edgeBarWidth)
                        .attr("height", cellSize)
                        .attr("x", function (d) {
                            return nodePositions[d.target] + i * edgeBarWidth;
                        })
                        .attr("y", function (d) {
                            return nodePositions[d.source];
                        })
                        .style("fill", edgeColors(attr))
                        .style("fill-opacity", 0.3);

                    d3.select(this).append("rect")
                        .attr("class", "ADMEdgeAttribute")
                        .attr("width", edgeBarWidth)
                        .attr("height", function (d) {
                            return edgeBarScales[attr](d.attributes[attr]);
                        })
                        .attr("x", function (d) {
                            return nodePositions[d.target] + i * edgeBarWidth;
                        })
                        .attr("y", function (d) {
                            return (nodePositions[d.source] + cellSize) - edgeBarScales[attr](d.attributes[attr]);
                        })
                        .style("fill", edgeColors(attr));
                }
            }

            // visualize edges without attributes as plain edges
            if (!Object.keys(e.attributes).length) {
                d3.select(this).append("rect")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("x", function (d) {
                        return nodePositions[d.source];
                    })
                    .attr("y", function (d) {
                        return nodePositions[d.target];
                    })
                    .style("fill", "gray");

                // repeat with swapped source and target
                d3.select(this).append("rect")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("x", function (d) {
                        return nodePositions[d.target];
                    })
                    .attr("y", function (d) {
                        return nodePositions[d.source];
                    })
                    .style("fill", "gray");
            }
        });
    }

    // overlay a grid
    const matrix = [];
    for (let i = 0; i <= network.nodes.length; i++) {
        for (let j = 0; j <= network.nodes.length; j++) {
            matrix.push({x: i * cellSize, y: j * cellSize, header: i === 0 || j === 0});
        }
    }
    matrix.shift();

    g.append("g")
        .attr("class", "ADMGrid")
        .selectAll("g")
        .data(matrix)
        .enter().append("rect")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", function (d) {
            return d.header ? "2px" : "1px";
        });
}