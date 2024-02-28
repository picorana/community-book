let nodeAttributeAnimations = [];
let edgeAttributeAnimations = [];

function animateVisualization() {
    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_00",
            start: "top center",
            end: "bottom bottom"
        }
    })
        .to(".NLDNode:first-of-type", {
            visibility: "visible"
        });

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_01",
            start: "top center",
            end: "bottom bottom",
            scrub: true
        }
    })
        .to(".NLDNode:not(:first-of-type)", {visibility: "visible", duration: 0})
        .from(".NLDNode:not(:first-of-type)", {opacity: 0, scale: 0, transformOrigin: "center center", stagger: 1});

    gsap.timeline({scrollTrigger: {trigger: ".nld_10", start: "top center", end: "bottom bottom", scrub: true}})
        .to(".NLDEdge:first-of-type", {visibility: "visible", duration: 0})
        .fromTo(".NLDEdge:first-of-type > .NLDEdgeLine", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: function (index, target) {
                return "-" + Math.round(getLength(target) / 2);
            }
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        });

    gsap.timeline({
        scrollTrigger: {
            trigger: ".nld_11",
            start: "top center",
            end: "bottom bottom",
            scrub: true
        }
    })
        .to(".NLDEdge:not(:first-of-type)", {visibility: "visible", duration: 0})
        .fromTo(".NLDEdge:not(:first-of-type) > .NLDEdgeLine", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: function (index, target) {
                return "-" + Math.round(getLength(target) / 2);
            }
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0", stagger: 1
        });
}

function addNodeAttributes() {
    barsOnNodes();
    addNodeAttributesDescription();

    nodeAttributeAnimations.push(gsap.timeline({
        scrollTrigger: {
            trigger: "#nld100, #nld200",
            start: "center center",
            end: "150% bottom",
            scrub: true
        }
    })
        .to(".NLDNode:first-of-type > .NLDNodeAttribute", {visibility: "visible", duration: 0})
        .fromTo(".NLDNode:first-of-type > .NLDNodeAttribute:first-of-type", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        })
        .fromTo(".NLDNode:first-of-type > .NLDNodeAttribute:not(:first-of-type)", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        }));

    nodeAttributeAnimations.push(gsap.timeline({
        scrollTrigger: {
            trigger: "#nld101, #nld201",
            start: "top center",
            end: "bottom bottom",
            scrub: true,
        },
    })
        .to(".NLDNode:not(:first-of-type) > .NLDNodeAttribute", {visibility: "visible", duration: 0})
        .fromTo(".NLDNode:not(:first-of-type) > .NLDNodeAttribute", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        }));
}

function hideNodeAttributes() {
    plainNodes();
    gsap.timeline()
        .to("#singleNodeAttribute, #singleNodeAttributes", {opacity: 0, y: 50, duration: 0.5, stagger: {from: "end", each: 0.25}})
        .to("#singleNodeAttribute, #singleNodeAttributes", {visibility: "hidden"});
    nodeAttributeAnimations.forEach(a => a.kill());
}

function addEdgeAttributes() {
    barsOnEdges();

    edgeAttributeAnimations.push(gsap.timeline({
        scrollTrigger: {
            trigger: "#nld210",
            start: "center center",
            end: "bottom bottom",
            scrub: true
        }
    })
        .to(".NLDEdge:first-of-type > .NLDEdgeAttribute", {visibility: "visible", duration: 0})
        .fromTo(".NLDEdge:first-of-type > .NLDEdgeAttribute:first-of-type", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        })
        .fromTo(".NLDEdge:first-of-type > .NLDEdgeAttribute:not(:first-of-type)", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0"
        }));

    edgeAttributeAnimations.push(gsap.timeline({
        scrollTrigger: {
            trigger: "#nld211",
            start: "top center",
            end: "bottom bottom",
            scrub: true,
        },
    })
        .to(".NLDEdge:not(:first-of-type) > .NLDEdgeAttribute", {visibility: "visible", duration: 0})
        .fromTo(".NLDEdge:not(:first-of-type) > .NLDEdgeAttribute", {
            strokeDasharray: function (index, target) {
                return "0 " + getLength(target);
            },
            strokeDashoffset: "0"
        }, {
            strokeDasharray: function (index, target) {
                let len = getLength(target);
                return len + " " + len;
            },
            strokeDashoffset: "0", stagger: 1
        }));
}

function hideEdgeAttributes() {
    d3.selectAll(".NLDEdgeAttribute").remove();
    gsap.timeline()
        .to("#singleEdgeAttribute, #singleEdgeAttributes", {opacity: 0, y: 50, duration: 0.5, stagger: {from: "end", each: 0.25}})
        .to("#singleEdgeAttribute, #singleEdgeAttributes", {visibility: "hidden"});
    edgeAttributeAnimations.forEach(a => a.kill());
}