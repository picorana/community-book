

let degrees = {}

function detectStairs(nodes, edges) {
    const whatIsAStair = 3; // at least 3 steps
    const delta = 2; // infinite or predefined (max. 2)

    const order = {};
    nodes.forEach((d, i) => {
        order[d.id] = i;
    });

    let fixed = null;
    let direction = null;

    let previous = null;

    let stairs = [];
    let current = [];

    let fixedNodes = [];
    let types = [];
    let type = null;



    edges.forEach(function (d) {

        degrees[d.source] = (degrees[d.source] || 0) + 1;
        degrees[d.target] = (degrees[d.target] || 0) + 1;
        if (fixed != null) { // check further stair
            if (fixed === d.source) {
                let diff = order[d.target] - order[previous.target];
                let cross = order[d.target] - order[previous.source];
                if (direction === "increasing" && diff > 0 && diff <= delta) { // same upper node, increasing edge length
                    if (Math.abs(diff) !== 1) {
                        type = "semi optimal";
                    }
                    current.push(d);
                } else if (direction === "decreasing" && diff < 0 && Math.abs(diff) <= delta) { // same upper node, decreasing edge length
                    if (Math.abs(diff) !== 1) {
                        type = "semi optimal";
                    }
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
                    if (Math.abs(diff) !== 1) {
                        type = "semi optimal";
                    }
                    current.push(d)
                } else if (direction === "decreasing" && diff > 0 && diff <= delta) { // same lower node, decreasing edge length
                    if (Math.abs(diff) !== 1) {
                        type = "semi optimal";
                    }
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
                if (Math.abs(diff) !== 1) {
                    type = "semi optimal";
                }
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
                if (Math.abs(diff) !== 1) {
                    type = "semi optimal";
                }
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