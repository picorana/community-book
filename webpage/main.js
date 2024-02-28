const margin = 20;
const width = parseInt(d3.select("svg").style("width"), 10) - 2 * margin;
const height = parseInt(d3.select("svg").style("height"), 10) - 2 * margin;

const g = d3.selectAll("#visualization").append("g").attr("transform", "translate(" + 20 + ", " + 20 + ")");

d3.json("data1.json").then(function (data) {
    nodeLinkDiagram(g, width, height, createNetworkData(data));
    animateVisualization();
    animateDescription();
});

// handle horizontal scrolling
ScrollTrigger.create({
    trigger: "#nld1",
    scroller: "#nld",
    horizontal: true,
    start: "left center",
    end:"right center",
    onEnter: () => addNodeAttributes(),
    onLeaveBack: () => hideNodeAttributes(),
    onLeave: () => addEdgeAttributes(),
    onEnterBack: () => hideEdgeAttributes()
})

