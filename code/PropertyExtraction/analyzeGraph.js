#!/usr/bin/env node


// Node.js functions to access files and execute code outside this file
const fs = require('fs');
const vm = require('vm');
const path = require('path');


// Function to load and execute another script (.js file)
function loadScript(scriptPath) {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    vm.runInThisContext(scriptContent);
    // thanks node.js for no simple import of another file
}

// Load external scripts
loadScript('../utility.js');
loadScript('./stairsHelper.js');
loadScript('./escalatorHelper.js');
loadScript('./runwayHelper.js');


// toggle timekeeping
let timekeeping = true;

// Ordering keys for nodes and edges in one structure
let orderingKeysArray = [
    ['alphabetical', 'alphabetical']
    //,['mean', 'alphabetical'] // example of how multiple key combinations can work
    //,['alphabetical', 'mean']
    //,['mean', 'mean']
]

// Actual starting point:
timekeeping ? console.time("Full runtime") : null;

/* // Example for full directory scraping
analyzeDataDir('../data')
    .then(() => {
        if (timekeeping) {
            console.timeEnd("Full runtime")
            console.log("All thanks to async!")
        }

    })
    .catch((error) => {
        console.error("An error occurred:", error);
        timekeeping ? console.timeEnd("Full runtime") : null;
    });
*/

// Example for single file
analyzeData('../data', 'example_thesis.json')
    .then(() => {
        if (timekeeping) {
            console.timeEnd("Full runtime")
        }
    })
    .catch((error) => {
        console.error("An error occurred:", error);
        if (timekeeping) console.timeEnd("Full runtime");
    });


/**
 * Scrapes a whole directory provided by a directory path to analyze all valid files inside.
 * Must be in json format, for specifics look into 'analyzeGraph' where the file is actually read.
 * @param dir relative path from where this script is called to the desired directory
 */
function analyzeDataDir(dir = '../data') {

    // The internal variable '__dirname' is the path to the current place where this script is called
    // we append the directory where all the json files reside to be read (relative from current position!)
    const directoryPath = path.join(__dirname, dir);

    try {
        // Synchronously read the directory, if async the console log breaks for obvious reasons
        const dirFiles = fs.readdirSync(directoryPath);

        // Create a promise for each file to be processed
        const fileProcessingPromises = dirFiles
            .filter(filename => path.extname(filename) === '.json') // Filter files by .json extension
            .map(filename => {
                return readGraph(directoryPath, filename);
            });

        // Return a promise that resolves when all files have been processed
        return Promise.all(fileProcessingPromises);
    } catch (err) {
        console.error('Unable to scan directory:', err);
        return Promise.reject(err);
    }
}

/**
 * Start analyzing a single datafile given by filename and directory.
 * @param dir relative path from where this script is called to the desired directory
 * @param filename name of the json file
 */
function analyzeData(dir = '../data', filename) {

    // see comment in analyzeDataDir for explanation of directoryPath
    const directoryPath = path.join(__dirname, dir);
    return readGraph(directoryPath, filename)
}

/**
 * Analyzes a graph given as a json file through it's the filename and the directory path.
 * The data is read in here not before.
 * @param filepath full path to the json file
 * @param filename name of the json file
 */
function readGraph(filepath, filename) {

    const fullPath = path.join(filepath, filename);

    timekeeping ? console.time(`Analysis time for ${filename}`) : null;

    return parseJsonFile(fullPath)
        .then(jsonData => {

            console.log(`Read data from ${filename}: \r\n`)
            //console.log(jsonData);

            let nodes = jsonData.nodes;
            let edges = jsonData.links;
            // TODO: might not be 'links' for every file so might need to catch that here

            orderingKeysArray.forEach(orderKeys => {
                let [nodeOrderKey, edgeOrderKey] = [orderKeys[0], orderKeys[1]]

                // Ordering Nodes and Edges
                timekeeping ? console.time("Ordering Nodes and Edges") : null;
                console.log(`Ordering Nodes with ${nodeOrderKey} key`)
                sortNodes(nodeOrderKey, nodes, edges, jsonData)
                console.log(`Ordering Edges with ${edgeOrderKey} key`)
                sortEdges(edgeOrderKey, nodes, edges)
                timekeeping ? console.timeEnd("Ordering Nodes and Edges") : null;
                console.log("") // formatting of console log


                /* start analyzing the ordered nodes and edges as if they were displayed by bio-fabric */

                // Stairs
                timekeeping ? console.time("Analyzing stairs") : null;
                let [stairs, stairQualities] = detectStairs(nodes, edges)
                timekeeping ? console.timeEnd("Analyzing stairs") : null;
                //console.log(stairs)
                //console.log(stairQualities)
                console.log(`Found ${stairs.length > 0 ? stairs.length : "no"} stair${stairs.length !== 1 ? "s" : ""}!\r\n`)

                // Escalators
                timekeeping ? console.time("Analyzing escalators") : null;
                let escalators = detectEscalators(nodes, edges)
                timekeeping ? console.timeEnd("Analyzing escalators") : null;
                //console.log(escalators)
                console.log(`Found ${escalators.length > 0 ? escalators.length : "no"} escalator${escalators.length !== 1 ? "s" : ""}!\r\n`)

                // Runways
                timekeeping ? console.time("Analyzing runways") : null;
                let runways = detectRunways(edges)
                timekeeping ? console.timeEnd("Analyzing runways") : null;
                //console.log(runways)
                console.log(`Found ${runways.length > 0 ? runways.length : "no"} runway${runways.length !== 1 ? "s" : ""}!\r\n`)

                console.log('----------------------------------------------------------\r\n')

            });

            timekeeping ? console.timeEnd(`Analysis time for ${filename}`) : null;
            console.log('----------------------------------------------------------\r\n\r\n')

            // return something so the promise chain works for the full time tracking
            return 0;
        })
        .catch(err => {
            // Handle the error here
            console.error("Error during JSON parsing or file reading:", err);
            timekeeping ? console.timeEnd(`Analysis time for ${filename}`) : null;

            // Rethrow the error or handle it as needed
            throw err;
        });
}

/**
 * reading and parsin the json given by the filepath
 * @param filePath full path to the json file
 */
function parseJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                // Basic I/O error catching
                console.error(`Error reading file ${filePath}:`, err);
                return reject(err);
            }

            try { // parsing the file
                const jsonData = JSON.parse(data);
                resolve(jsonData);
            } catch (parseErr) {
                console.error(`Error parsing JSON from file ${filePath}:`, parseErr);
                reject(parseErr);
            }
        });
    });
}

/**
 * Function to relay sorting of nodes to the utility functions already implemented
 */
function sortNodes(orderKey, nodes, edges, data) {
    switch (orderKey) {
        case "random":
            sortRandomly(nodes);
            break;
        case "alphabetical" :
            sortAlphabetically(nodes);
            break;
        case "mean" :
            sortByMean(nodes);
            break;
        case "degree" :
            sortByDegree(nodes, edges);
            break;
        case "edges" :
        case "rcm" :
            sortByRCM(data);
            break;
        case "adjacency":
            sortByNeighborhood(nodes, edges);
            break;
        case "cluster":
            // TODO
            break;
        case "gansner":
            sortByGansner(nodes);
            break;
        default :
            sortAlphabetically(nodes)
            break;
    }
}

/**
 * Function to relay sorting of edges to the utility functions already implemented
 */
function sortEdges(orderKey, nodes, edges) {
    switch (orderKey) {
        case "random":
            sortRandomly(edges);
            break;
        case "nodes" :
            sortByNodes(nodes, edges);
            break;
        case "degree":
            sortEdgesByDegree(nodes, edges);
            break;
        case "mean" :
            sortByMean(edges);
            break;
        case "staircases":
            sortForStaircases(nodes, edges);
            break;
        default :
            sortByNodes(nodes, edges)
            break;
    }
}
