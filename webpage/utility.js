// Helpful functions for the visualization of network data.

/**
 * This function gets the labels of node or edge attributes.
 * @param list list of nodes or edges
 * @returns {*[]} list of categories
 */
function getAttributeLabels(list) {
    let labels = [];
    list.forEach(function (d) {
        Object.keys(d.attributes).forEach(function (l) {
            if (labels.indexOf(l) === -1) {
                labels.push(l);
            }
        });
    });

    return labels.sort();
}

/**
 * This function gets the layers of nodes.
 * @param nodes
 * @returns {*[]} list of layers
 */
function getLayers(nodes) {
    let layers = [];
    nodes.forEach(function (d) {
        if (layers.indexOf(d.layer) === -1) {
            layers.push(d.layer);
        }
    });

    return layers.sort();
}

/**
 * This function defines scales for each categorical attribute based on the range of the numerical values in the data.
 * @param attributes
 * @param data list of nodes or edges.
 * @param min minimal value to map to
 * @param max maximal value to map to
 * @returns {*} array of linear scales
 */
function defineScales(attributes, data, min, max) {
    let scales = {};
    attributes.forEach(function (c) {
        let filtered = data.filter(d => c in d.attributes).map(d => d.attributes[c]);
        scales[c] = d3.scaleLinear()
            .domain(d3.extent(filtered))
            .range([min, max]);
    });

    return scales;
}

/**
 * This function sorts the nodes in alphabetical order of their name.
 * @param nodes
 */
function sortAlphabetically(nodes) {
    nodes.sort(function (a, b) {
        return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
    });
}

/**
 * This function sorts the given nodes or edges in descending order based on the numerical value of a given attribute.
 * @param attr
 * @param list of nodes or edges
 */
function sortByAttribute(attr, list) {
    list.sort(function (a, b) {
        let a_value = attr in a.attributes ? a.attributes[attr] : Number.NEGATIVE_INFINITY;
        let b_value = attr in b.attributes ? b.attributes[attr] : Number.NEGATIVE_INFINITY;
        return (a_value < b_value) ? 1 : ((b_value < a_value) ? -1 : 0);
    })
}

/**
 * This function sorts the nodes in descending order based on the mean of the existing numerical attributes.
 * @param list of nodes or edges
 */
function sortByMean(list) {
    list.sort(function (a, b) {
        let a_length = Object.keys(a.attributes).length
        let b_length = Object.keys(b.attributes).length
        let a_mean = a_length ? Object.values(a.attributes).reduce((x, y) => x + y) / a_length : Number.NEGATIVE_INFINITY;
        let b_mean = b_length ? Object.values(b.attributes).reduce((x, y) => x + y) / b_length : Number.NEGATIVE_INFINITY;
        return (a_mean < b_mean) ? 1 : ((b_mean < a_mean) ? -1 : 0);
    })
}

/**
 * This function sorts the edges based on the ordering of the adjacent nodes.
 * @param nodes
 * @param edges
 */
function sortByNodes(nodes, edges) {
    edges.sort(function (a, b) {
        let map = function (id) {
            return nodes.map(n => n.id).indexOf(id);
        };
        let a1 = map(a.source) < map(a.target) ? map(a.source) : map(a.target);
        let a2 = map(a.source) < map(a.target) ? map(a.target) : map(a.source);
        let b1 = map(b.source) < map(b.target) ? map(b.source) : map(b.target);
        let b2 = map(b.source) < map(b.target) ? map(b.target) : map(b.source);

        return a1 > b1 ? 1 : (a1 < b1 ? -1 : (a2 > b2 ? 1 : (a2 < b2 ? -1 : 0)));
    });
}

/**
 * This function sorts the nodes in descending order based on the number of their edges.
 * @param nodes
 * @param edges
 */
function sortByEdgeCount(nodes, edges) {
    nodes.sort(function (a, b) {
        let count = function (id) {
            return edges.filter(e => e.source === id || e.target === id).length;
        };
        return (count(a.id) < count(b.id)) ? 1 : (count(b.id) < count(a.id) ? -1 : 0);
    });
}

/**
 * This function calculates the normalized vector between two points
 * @param a first point
 * @param b second point
 * @returns {{x: number, y: number}} norm vector
 */
function norm(a, b) {
    let vector = {x: a.x - b.x, y: a.y - b.y};
    let distance = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    return {"x": vector.x / distance, "y": vector.y / distance};
}

/**
 * This function calculates the parallel shift of the line between two points by the given distance.
 * @param distance
 * @param a first point
 * @param b second point
 * @returns {{x: number, y: number}}
 */
function shift(distance, a, b) {
    let x1_x0 = b.x - a.x;
    let y1_y0 = b.y - a.y;
    let x2_x0, y2_y0;

    if (y1_y0 === 0) {
        x2_x0 = 0;
        y2_y0 = distance;
    } else {
        let angle = Math.atan(x1_x0 / y1_y0);
        x2_x0 = -distance * Math.cos(angle);
        y2_y0 = distance * Math.sin(angle);
    }
    return {"x": x2_x0, "y": y2_y0};
}

/**
 * This function assigns each node to a layer based on their attribute with the highest value.
 * The calculation uses relative values based on the range of each attribute.
 * @param nodes
 */
function defineLayers(nodes) {
    let range = function (attr) {
        let values = nodes.filter(n => attr in n.attributes).map(n => n.attributes[attr]);
        return {"min": Math.min(...values), "max": Math.max(...values)};
    };
    nodes.forEach(function (n) {
        if (!Object.keys(n.attributes).length) {
            n.layer = -1;
        } else {
            let normalized = {};
            for (let [attr, value] of Object.entries(n.attributes)) {
                let extremes = range(attr);
                normalized[attr] = (value - extremes.min) / (extremes.max - extremes.min);
            }
            n.layer = Object.keys(normalized).reduce((a, b) => normalized[a] > normalized[b] ? a : b);
        }
    });
}

/**
 * This function determines if the layer is at even index in the list of layers.
 * Even layers are displayed horizontally, odd layers use vertical alignment.
 * @param layer
 * @param list of layers
 * @returns {boolean}
 */
function isEven(layer, list) {
    return list.indexOf(layer) % 2 === 0;
}

// function to determine if layers are consecutive
/**
 * This function determines if the two given layers are consecutive
 * @param a
 * @param b
 * @param list of layers
 * @returns {boolean}
 */
function areConsecutive(a, b, list) {
    return Math.abs(list.indexOf(a) - list.indexOf(b)) === 1;
}

/**
 * This function determines whether the second layer is followed by the first layer
 * @param a first layer
 * @param b second layer
 * @param list of layers
 * @returns {boolean}
 */
function isFollowingLayer(a, b, list) {
    return list.indexOf(a) === list.indexOf(b) + 1;
}

/**
 * This function counts the maximal amount of cells to be displayed in the vertical and horizontal. It is used for scaling purposes.
 * @param nodes
 * @param edges
 * @param layers
 * @param number of categories
 * @returns {{horizontal: number, vertical: number}}
 */
function countCells(nodes, edges, layers, number) {
    let verticalCount = 0;
    let horizontalCount = 0;
    nodes.forEach(function (n) {
        // count nodes of following layer
        let count = nodes.filter(d => isFollowingLayer(d.layer, n.layer, layers)).length;
        // add number of skip links from this node
        count += edges.filter(e => e.source === n.id && !areConsecutive(n.layer, nodes.find(c => c.id === e.target).layer, layers)).length;
        // add number of nodes with different alignment
        count += nodes.filter(d => isEven(d.layer, layers) !== isEven(n.layer, layers) && layers.indexOf(d.layer) < layers.indexOf(n.layer)).length;
        // add number of layers with same alignment
        count += layers.filter((l, i) => isEven(l, layers) === isEven(n.layer, layers) && i <= layers.indexOf(n.layer)).length;
        if (!isEven(n.layer, layers) && horizontalCount < count) {
            horizontalCount = count;
        } else if (isEven(n.layer, layers) && verticalCount < count) {
            verticalCount = count;
        }
    });
    if (!number) {
        horizontalCount = nodes.length;
    }
    return {"vertical": verticalCount, "horizontal": horizontalCount};
}

/**
 * This function shuffles the elements of an array using the Fisher-Yates algorithm.
 * @param array
 * @returns {*} shuffled array
 */
function shuffle(array) {
    let currentIndex = array.length;
    let randomIndex, temp;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }

    return array;
}

/**
 * This function computes the length of a given line element.
 * @param line
 * @returns {number} length
 */
function getLength(line) {
    let x1 = line.x1.baseVal.value;
    let x2 = line.x2.baseVal.value;
    let y1 = line.y1.baseVal.value;
    let y2 = line.y2.baseVal.value;
    return Math.ceil(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}