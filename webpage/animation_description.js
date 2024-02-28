function animateDescription() {
    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_00",
            start: "top center",
            end: "bottom bottom",
        }
    })
        .to(".nodeDescription", {display: "block"})
        .to("#singleNode", {visibility: "visible"});

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_01",
            start: "top center",
            end: "bottom bottom",
            scrub: true,
        }
    })
        .to("#multipleNodes", {visibility: "visible"})
        .from("#multipleNodes", {opacity: 0, y: 50, duration: 1});

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_10",
            start: "top bottom",
            end: "top center",
            scrub: true
        }
    })
        .to(".nodeDescription", {y: "-50vh", duration: 1})
        .to("#background", {backgroundColor: "#FAEBD7FF", duration: 1}, 0)
        .to(".nodeDescription", {visibility: "hidden", display: "none"});

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_10",
            start: "top center",
            end: "bottom bottom",
            scrub: true
        }
    })
        .to(".edgeDescription", {display: "block"})
        .to("#singleEdge", {visibility: "visible"})
        .from("#singleEdge", {opacity: 0, y: 50, duration: 1});

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_11",
            start: "top center",
            end: "bottom bottom",
            scrub: true
        }
    })
        .to("#multipleEdges", {visibility: "visible"})
        .from("#multipleEdges", {opacity: 0, y: 50, duration: 1});
}

function addNodeAttributesDescription() {
    nodeAttributeAnimations.push(gsap.timeline({
        scrollTrigger: {
            trigger: "#nld100, #nld200",
            start: "center center",
            end: "150% bottom",
            scrub: true
        }
    })
        .to("#singleNodeAttribute", {visibility: "visible"})
        .from("#singleNodeAttribute", {opacity: 0, y: 50, duration: 1})
        .to("#singleNodeAttributes", {visibility: "visible"})
        .from("#singleNodeAttributes", {opacity: 0, y: 50, duration: 1}));
}

function addEdgeAttributeDescription() {

}