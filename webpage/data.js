/**
 * This function updates the visualizations to the selected data.
 * It also highlights the corresponding item in the navigation bar.
 * @param e clicked navigation item
 * @param filename to load
 */
function updateData(e, filename) {
    d3.selectAll(".nav-link").classed("active", false);
    d3.select(e).select(".nav-link").classed("active", true);

    d3.json(filename).then(function (data) {
        updateVisualizations(createNetworkData(data));
    });
}

/**
 * This function creates a dictionary from the given network data.
 * The nodes and edges are returned within arrays.
 * @param data
 * @returns {{nodes: *[], edges: *[]}}
 */
function createNetworkData(data) {
    const edges = data.links;
    const nodes = data.nodes;

    nodes.forEach(function (n) {
        n.name = String(n.name);
        if (n.attributes === undefined) {
            n.attributes = {};
        }
        if (n.layer === undefined) {
            n.layer = -1;
        }
    });

    edges.forEach(function (e) {
        // order source and target nodes by id
        if (e.source > e.target) {
            let temp = e.source;
            e.source = e.target;
            e.target = temp;
        }
    });

    return {"nodes": nodes, "edges": edges};
}