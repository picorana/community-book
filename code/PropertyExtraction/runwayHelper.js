function detectRunways(edges) {

    const whatIsARunway = 3; // at least 3 consecutive parts
    let streakNodeID = null;
    let currentStreak = [];
    let resultStreaks = [];

    edges.forEach((edge, index) => {
        // Check if the edge continues the current streak
        if (streakNodeID === null || edge.source === streakNodeID || edge.target === streakNodeID) {
            // Start a new streak or continue the current streak
            if (currentStreak.length === 0) {
                streakNodeID = edge.source === streakNodeID || streakNodeID === null ? edge.source : edge.target;
            }
            currentStreak.push(edge);
        } else {
            // If the streak is broken and long enough, add it to resultStreaks
            if (currentStreak.length >= whatIsARunway) {
                resultStreaks.push([...currentStreak]);
            }
            // Start a new streak with the current edge
            currentStreak = [edge];
            streakNodeID = edge.source; // Initialize streakNodeID with the current edge's source
        }

        // Handle the last streak in the list
        if (index === edges.length - 1 && currentStreak.length >= whatIsARunway) {
            resultStreaks.push([...currentStreak]);
        }
    });

    return resultStreaks;
}
