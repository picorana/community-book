const margin = 20;
const width = parseInt(d3.select("svg").style("width"), 10) - 2 * margin;
const height = parseInt(d3.select("svg").style("height"), 10) - 2 * margin;

d3.selectAll("svg").append("g").attr("transform", "translate(" + 20 + ", " + 20 + ")")

// initial visualization:
d3.json("data1.json").then(function (data) {
    updateVisualizations(createNetworkData(data));
});

function updateVisualizations(network) {
    d3.selectAll("#node-link_diagram, #adjacency_matrix, #quilt, #biofabric").selectAll("g").selectAll("*").remove();

    // node-link diagram:
    const nld = d3.select("#node-link_diagram")
    nodeLinkDiagram(nld.select("#plain").select("g"), width, height, network, "plainNodes", "plainEdges", "");
    nodeLinkDiagram(nld.select("#bars").select("g"), width, height, network, "barsOnNodes", "barsOnEdges", "");

    // adjacency matrix:
    const adm = d3.select("#adjacency_matrix")
    adjacencyMatrix(adm.select("#plain").select("g"), width, height, network, "plainNodes", "plainEdges", "Alphabetical", "", "");
    adjacencyMatrix(adm.select("#juxta_bars").select("g"), width, height, network, "juxtaposedNodes", "multipleEdges", "Alphabetical", "", "");

    // quilt:
    const qlt = d3.select("#quilt")
    quilt(qlt.select("#plain").select("g"), width, height, network, "plainNodes", "plainEdges", "Alphabetical", "", "");
    quilt(qlt.select("#colored").select("g"), width, height, network, "coloredNodes", "coloredEdges", "Alphabetical", "", "");

    // biofabric:
    const bf = d3.select("#biofabric")
    bioFabric(bf.select("#plain").select("g"), width, height, network, "plainNodes", "plainEdges", "Alphabetical", "Alphabetical", "Nodes", "");
    bioFabric(bf.select("#juxta").select("g"), width, height, network, "juxtaposedNodes", "barsAndJuxtaposed", "Alphabetical", "Nodes", "");
}
