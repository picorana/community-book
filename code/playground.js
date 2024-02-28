// Control of the visualization playground

// define the visualization space
/*
const width = 1600;
const height = 800;
const margin = 20;

const svg = d3.select("body").append("svg")
    .attr("width", width + 2 * margin)
    .attr("height", height + 2 * margin);

const g = svg.append("g")
    .attr("transform", "translate(" + margin + ", " + margin + ")");
const g1 = svg.append("g")
    .attr("transform", "translate(" + margin + ", " + margin + ")");
const g2 = svg.append("g")
    .attr("transform", "translate(" + ((width / 2) + 2 * margin) + ", " + margin + ")");
const g3 = svg.append("g")
    .attr("transform", "translate(" + margin + ", " + (height / 2 + 2 * margin) + ")");
const g4 = svg.append("g")
    .attr("transform", "translate(" + ((width / 2) + 2 * margin) + ", " + (height / 2 + 2 * margin) + ")"); */

const svg = d3.select("body").append("svg").attr("id", "vis").attr("class", "vis");
const margin = 10;
// const width = parseInt(d3.select("#vis").style("width"), 10) - 2 * margin;
// const height = parseInt(d3.select("#vis").style("height"), 10) - 2 * margin;
const width = 1000;
const height = 5000;
const g = svg.append("g").attr("transform", "translate(" + margin + ", " + margin + ")");
const list_of_gs = [];

// define default settings
let number = "1";
let currentFile = d3.json("data/example_thesis.json");
let currentFilename = "data/example_thesis.json";
let loadedFile;
let currentTechnique = "";
let study = true;

let NLDNodeEncoding = "plainNodes";
let NLDEdgeEncoding = "plainEdges";
let NLDNodeAttribute = "";
let NLDEdgeAttribute = "";

let ADMNodeEncoding = "plainNodes";
let ADMEdgeEncoding = "plainEdges";
let ADMNodeAttribute = "";
let ADMEdgeAttribute = "";
let ADMNodeOrdering = "Alphabetical";
let ADMNodeShading = false;

let QLTNodeEncoding = "plainNodes";
let QLTEdgeEncoding = "plainEdges";
let QLTNodeAttribute = "";
let QLTEdgeAttribute = "";
let QLTNodeOrdering = "Alphabetical";

let BFNodeEncoding = "plainNodes";
let BFEdgeEncoding = "plainEdges";
let BFNodeAttribute = "";
let BFEdgeAttribute = "";
let BFNodeOrdering = "Alphabetical";
let BFEdgeOrdering = "Nodes";
let BFNodeShading = false;
let BFEdgeShading = false;
let BFDoubleEdges = false;
let BFNodeHighlighting = "line";

let selectedNode = null;
let selectedEdge = null;
let selectedNodeSide = "top";

let year_range = [2000, 2022];
let paging_criterion = "communities";

async function redrawVisualization(){
    svg.selectAll("g").selectAll("*").remove();

    let data = {
        "nodes": [],
        "links": []
    };

    let authorlist = await d3.json("data/author_community(3).json");
    for (let a in authorlist["authors"]){
        let author = authorlist["authors"][a];
        data["nodes"].push({"id": a, "name": author["community"] + author["author"], "community": author["community"]})
    }

    let paperlist = await d3.csv("data/IEEE VIS papers 1990-2022 - Main dataset.csv")
    for (let paper of paperlist){
        if (parseInt(paper["Year"]) < year_range[0] || parseInt(paper["Year"]) > year_range[1]) continue;
        let authors_of_paper = paper["AuthorNames"].split(";");
        if (authors_of_paper.length < 2) continue;

        // add an edge for every combination of authors
        for (let i = 0; i < authors_of_paper.length; i++){
            for (let j = i+1; j < authors_of_paper.length; j++){
                if (data["nodes"].find(d => d["name"].includes(authors_of_paper[i])) == undefined || data["nodes"].find(d => d["name"].includes(authors_of_paper[j])) == undefined) continue;
                // if (data["nodes"].find(d => d["name"] == authors_of_paper[i]) == undefined || data["nodes"].find(d => d["name"] == authors_of_paper[j]) == undefined) continue;
                data["links"].push({
                    "source": data["nodes"].find(d => d["name"].includes(authors_of_paper[i]))["id"],
                    "target": data["nodes"].find(d => d["name"].includes(authors_of_paper[j]))["id"],
                    "attributes": {
                        "paper": paper["Title"],
                        "year": paper["Year"]
                    }
                })
            }
        }
    }

    if (paging_criterion == "years"){
        for (let i = 0; i < year_range[1] - year_range[0]; i++) {
            let year = year_range[0] + i;
    
            let yeardata = {
                "nodes": data["nodes"],
                "links": data["links"].filter(d => d["attributes"]["year"] == year)
            };
    
            const networkData = createNetworkData(yeardata);
            updateOptions(networkData);
    
            let g = svg.append("g").attr("id", "layer" + i);
            g.attr("transform", "translate(" + (i * width + 200 * i) + ", " + + (i * 2) + ")");
            // g.style("opacity", 1 - i * 0.8);
            list_of_gs.push(g);
    
            biofabric({'g': g, 'width':width, 'height': height}, networkData);
        }
    } else if (paging_criterion == "communities"){
        let communities = Array.from(new Set(data["nodes"].map(d => d["community"]))).filter(c => data["nodes"].filter(d => d["community"] == c).length > 10);
        console.log("community size: ", data["nodes"].filter(d => d["community"] == communities[0]).length, "num communities: ", communities.length);

        for (let i = 0; i < communities.length; i++) {
            let community = communities[i];
            console.log(community)
    
            let communitydata = {
                "nodes": data["nodes"],
                "links": data["links"].filter(l => data["nodes"].find(d => d["id"] == l["source"])["community"] == community && data["nodes"].find(d => d["id"] == l["target"])["community"] == community)
            };

            console.log(communitydata);
    
            const networkData = createNetworkData(communitydata);
            updateOptions(networkData);
    
            let g = svg.append("g").attr("id", "layer" + i);
            g.attr("transform", "translate(" + (i * width + 200*i) + ", " + + (i * 2) + ")");
            // g.style("opacity", 1 - i * 0.3);
            list_of_gs.push(g);
    
            biofabric({'g': g, 'width':width, 'height': height}, networkData);
            // break;
        }
    }
}

/**
 * This function redraws the visualization based on the defined settings and the selected network data.
 */
async function redrawVisualization2() {
    d3.json(currentFilename).then(function (data) {
        // create nodes and edges
        const networkData = createNetworkData(data);
        updateOptions(networkData);

        for (let i = 0; i < num_layers; i++) {
            let g = svg.append("g").attr("id", "layer" + i);
            g.attr("transform", "translate(" + (i * 20) + ", " + + (i * 20) + ")");
            g.style("opacity", 1 - i * 0.3);
            list_of_gs.push(g);

            biofabric({'g': g, 'width':width, 'height': height}, networkData);
        }
    });
}

/**
 * This functions updates the ordering possibilities and selections on attributes based on the loaded network data.
 * @param network
 */
function updateOptions(network) {
    let nodeAttributes = getAttributeLabels(network.nodes);
    let edgeAttributes = getAttributeLabels(network.edges);

    // selection of a node attribute
    let techniques = ["NLD", "ADM", "QLT", "BF"];
    techniques.forEach(function (t) {
        d3.select("#attribute" + t).selectAll("a").remove();
        d3.select("#attribute" + t)
            .selectAll("a")
            .data(nodeAttributes)
            .enter()
            .append("a")
            .attr("id", function (d) {
                return d + t;
            })
            .attr("class", "dropdown-item")
            .attr("href", "#")
            .text(function (d) {
                return d;
            })
            .on("click", function () {
                switch (t) {
                    case "NLD":
                        changeSelectedNodeAttributeNLD(d3.select(this).attr("id").slice(0, -3));
                        break;
                    case "ADM":
                        changeSelectedNodeAttribute(d3.select(this).attr("id").slice(0, -3));
                        break;
                    case "QLT":
                        QLTNodeAttribute = d3.select(this).attr("id").slice(0, -3);
                        break;
                    case "BF":
                        changeSelectedNodeAttributeBF(d3.select(this).attr("id").slice(0, -2));
                        break;
                }
                redrawVisualization();
            });
    });
    d3.select("#attributeQLT")
        .append("a")
        .attr("id", "layerQLT")
        .attr("class", "dropdown-item")
        .attr("href", "#")
        .text("Layer")
        .on("click", function () {
            QLTNodeAttribute = d3.select(this).attr("id").slice(0, -3);
            redrawVisualization();
        });

    // selection of an edge attribute
    techniques = ["NLD", "ADM", "QLT", "BF"];
    techniques.forEach(function (t) {
        d3.select("#edgeAttribute" + t).selectAll("a").remove();
        d3.select("#edgeAttribute" + t)
            .selectAll("a")
            .data(edgeAttributes)
            .enter()
            .append("a")
            .attr("id", function (d) {
                return d + t;
            })
            .attr("class", "dropdown-item")
            .attr("href", "#")
            .text(function (d) {
                return d;
            })
            .on("click", function () {
                switch (t) {
                    case "NLD":
                        changeSelectedEdgeAttributeNLD(d3.select(this).attr("id").slice(0, -3));
                        break;
                    case "ADM":
                        changeSelectedEdgeAttribute(d3.select(this).attr("id").slice(0, -3));
                        break;
                    case "QLT":
                        QLTEdgeAttribute = d3.select(this).attr("id").slice(0, -3);
                        break;
                    case "BF":
                        changeSelectedEdgeAttributeBF(d3.select(this).attr("id").slice(0, -2));
                        break;
                }
                redrawVisualization();
            });
    });

    // node ordering possibilities
    if (nodeAttributes.length > 1) {
        nodeAttributes.unshift("Random", "Alphabetical", "Degree", "Gansner", "RCM", "Mean", );
    } else {
        nodeAttributes.unshift("Random", "Alphabetical", "Degree", "Gansner", "RCM");
    }

    techniques = ["ADM", "QLT", "BF"];
    techniques.forEach(function (t) {
        d3.select("#ordering" + t).selectAll("a").remove();
        d3.select("#ordering" + t)
            .selectAll("a")
            .data(nodeAttributes)
            .enter()
            .append("a")
            .attr("id", function (d) {
                return d + t;
            })
            .attr("class", "dropdown-item")
            .attr("href", "#")
            .text(function (d) {
                return d;
            })
            .on("click", function () {
                switch (t) {
                    case "ADM":
                        changeSelectedNodeOrdering(d3.select(this).attr("id").slice(0, -3));
                        break;
                    case "QLT":
                        QLTNodeOrdering = d3.select(this).attr("id").slice(0, -3);
                        break;
                    case "BF":
                        changeSelectedNodeOrderingBF(d3.select(this).attr("id").slice(0, -2));
                        break;
                }
                redrawVisualization();
            });
    });

    // edge ordering possibilities
    if (edgeAttributes.length > 1) {
        edgeAttributes.unshift("Index of Nodes", "Random", "Degree", "Mean", "Staircases");
    } else {
        edgeAttributes.unshift("Index of Nodes", "Random", "Degree", "Staircases");
    }

    d3.select("#edgeOrderingBF").selectAll("a").remove();
    d3.select("#edgeOrderingBF")
        .selectAll("a")
        .data(edgeAttributes)
        .enter()
        .append("a")
        .attr("id", function (d) {
            return d + "BF";
        })
        .attr("class", "dropdown-item")
        .attr("href", "#")
        .text(function (d) {
            return d;
        })
        .on("click", function () {
            changeSelectedEdgeOrderingBF(d3.select(this).attr("id").slice(0, -2));
            redrawVisualization();
        });
}

/* The following code allows for interaction on the navigation bar and the selection of visualization settings */
// change number of visualizations
d3.selectAll("#numberDropDown").selectAll(".dropdown-item").on("click", function () {
    number = d3.select(this).attr("id");
    redrawVisualization();
});

// change visualized network
d3.selectAll("#dataDropDown").selectAll(".dropdown-item").on("click", function () {
    if (d3.select(this).attr("id") !== "loadData") {
        currentFile = d3.json("data/" + d3.select(this).attr("id"));
        currentFilename = "data/" + d3.select(this).attr("id");
        selectedNode = null;
        selectedEdge = null;
        redrawVisualization();
    }
});

// change visualization design
d3.selectAll("#studyDesign").on("change", function () {
    study = d3.select(this).property("checked");
    redrawVisualization();
});

// control the loading of custom data files
d3.select("#fileInput").on("change", function (e) {
    d3.selectAll("#errorMessage,#successMessage").style("display", "none");
    fileToJSON(e.target.files[0]).then(function (input) {
        let nodes = input["nodes"];
        let edges = input["links"];

        // data must match the required format
        if (nodes === undefined || nodes.map(n => n.id).includes(undefined) || nodes.map(n => n.name).includes(undefined)
            || new Set(nodes.map(n => n.id)).size !== nodes.map(n => n.id).length // includes duplicates
            || edges === undefined || edges.map(e => e.source).includes(undefined) || edges.map(e => e.target).includes(undefined)
            || edges.map(e => !nodes.map(n => n.id).includes(e.source) || !nodes.map(n => n.id).includes(e.target)).some(Boolean)
            || edges.map(e => e.target === e.source).some(Boolean)) {
            d3.select("#errorMessage").style("display", "block");
            d3.select("#loadButton").attr("disabled", "disabled");
        } else {
            loadedFile = e.target.files[0];
            d3.select("#successMessage").style("display", "block");
            d3.select("#loadButton").attr("disabled", null);
            selectedNode = null;
            selectedEdge = null;
        }
    });
});

d3.select("#loadButton").on("click", function () {
    currentFile = fileToJSON(loadedFile);
    redrawVisualization();
});

// change visualization technique
d3.selectAll("#techniques").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#techniques").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    d3.selectAll(".encoding").style("display", "none");

    currentTechnique = d3.select(this).select(".nav-link").attr("id");
    switch (currentTechnique) {
        case "NLD":
            d3.selectAll("#node-link-diagram").style("display", "block");
            break;
        case "ADM":
            d3.selectAll("#adjacency-matrix").style("display", "block");
            break;
        case "QLT":
            d3.selectAll("#quilt").style("display", "block");
            break;
        case "BF":
            d3.selectAll("#biofabric1").style("display", "block");
            d3.selectAll("#biofabric2").style("display", "block");
            break;
    }
    selectedNode = null;
    selectedEdge = null;
    redrawVisualization();
});

currentTechnique = "BF"
selectedNode = null;
selectedEdge = null;
redrawVisualization();

// change encodings of the node-link diagram
d3.selectAll("#nodeNLD").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#nodeNLD").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeNodeEncodingNLD(d3.select(this).select(".nav-link").attr("id").slice(0, -3));
    redrawVisualization();
});

d3.selectAll("#edgeNLD").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#edgeNLD").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeEdgeEncodingNLD(d3.select(this).select(".nav-link").attr("id").slice(0, -3));
    redrawVisualization();
});

d3.selectAll("#layoutNLD").selectAll(".dropdown-item").on("click", function () {
    changeLayoutNLD(d3.select(this).attr("id").slice(0, -3));
    redrawVisualization();
});

// change encodings of the adjacency matrix
d3.selectAll("#colorpicker").on("change", function () {
    d3.selectAll("#adm .grid rect").attr("stroke", d3.select("#colorpicker").property("value"));
});

d3.selectAll("#nodeADM").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#nodeADM").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeNodeEncoding(d3.select(this).select(".nav-link").attr("id").slice(0, -3));
    redrawVisualization();
});

d3.selectAll("#edgeADM").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#edgeADM").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeEdgeEncoding(d3.select(this).select(".nav-link").attr("id").slice(0, -3));
    redrawVisualization();
});

d3.selectAll("#nodeShadingADM").on("change", function () {
    ADMNodeShading = d3.select(this).property("checked");
    redrawVisualization();
});

// change encodings of the quilt
d3.selectAll("#nodeQLT").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#nodeQLT").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    QLTNodeEncoding = d3.select(this).select(".nav-link").attr("id").slice(0, -3);
    redrawVisualization();
});

d3.selectAll("#edgeQLT").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#edgeQLT").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    QLTEdgeEncoding = d3.select(this).select(".nav-link").attr("id").slice(0, -3);
    redrawVisualization();
});

// change encodings of the BioFabric
d3.selectAll("#nodeBF").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#nodeBF").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeNodeEncodingBF(d3.select(this).select(".nav-link").attr("id").slice(0, -2));
    redrawVisualization();
});

d3.selectAll("#edgeBF").selectAll(".nav-item").on("click", function () {
    d3.selectAll("#edgeBF").selectAll(".nav-item").classed("active", false);
    d3.select(this).classed("active", true);
    changeEdgeEncodingBF(d3.select(this).select(".nav-link").attr("id").slice(0, -2));
    redrawVisualization();
});

d3.selectAll("#nodeShadingBF").selectAll(".dropdown-item").on("click", function () {
    BFNodeShading = d3.select(this).attr("id").slice(0, -6);
    redrawVisualization();
});

d3.selectAll("#edgeShadingBF").selectAll(".dropdown-item").on("click", function () {
    BFEdgeShading = d3.select(this).attr("id").slice(0, -6);
    redrawVisualization();
});

d3.selectAll("#doubleEdgesBF").on("change", function () {
    BFDoubleEdges = d3.select(this).property("checked");
    switchDoubleEdgesBF(d3.select(this).property("checked"));
    redrawVisualization();
});

d3.selectAll("#stairsBF").on("change", function () {
    switchStairsBF(d3.select(this).property("checked"));
    //redrawVisualization();
});

d3.selectAll("#escalatorsBF").on("change", function () {
    switchEscalatorsBF(d3.select(this).property("checked"));
    //redrawVisualization();
});

d3.selectAll("#nodeHighlightingBF").selectAll(".dropdown-item").on("click", function () {
    BFNodeHighlighting = d3.select(this).attr("id").slice(0, -10);
    redrawVisualization();
});
