// Max/MSP JavaScript program to process a dictionary and fill a buffer

inlets = 1; // One inlet for the dictionary
outlets = 1; // No outlets since everything is done internally

// Global variables
var bufferName = jsarguments[1]; // Buffer name passed as an argument
// var noteCounts = new Array(name?: "note_counts"); // Array to be populated by the patcher
var maxNotes;

function msg_int(int) {
  maxNotes = int;
}


// Function to handle the dictionary input
function msg_dictionary(dictName) {
    var dict = new Dict(dictName); // Load the dictionary object

    // Retrieve arrays from the dictionary
    var startTime = dict.get("start_time");
    var pitch = dict.get("pitch");
    var velocity = dict.get("velocity");
    var duration = dict.get("duration");

    if (!startTime || !pitch || !velocity || !duration) {
        error("Dictionary must contain start_time, pitch, velocity, and duration arrays.\n");
        return;
    }

    // Check if the number of events matches the maximum of note_counts
    if (startTime.length !== maxNotes) {
        [startTime, pitch, velocity, duration] = balanceArrays(
            startTime, pitch, velocity, duration, maxNotes
        );
    }

    // Send the arrays to the specified buffer
    fillBuffer(bufferName, startTime, pitch, velocity, duration);
}

// Function to balance arrays to the target length by duplicating events
function balanceArrays(startTime, pitch, velocity, duration, targetLength) {
    while (startTime.length < targetLength) {
        var duplicateIndex = findMostIsolatedIndex(startTime);
        startTime.splice(duplicateIndex, 0, startTime[duplicateIndex]);
        pitch.splice(duplicateIndex, 0, pitch[duplicateIndex]);
        velocity.splice(duplicateIndex, 0, velocity[duplicateIndex]);
        duration.splice(duplicateIndex, 0, duration[duplicateIndex]);
    }
    return [startTime, pitch, velocity, duration];
}

// Function to find the most temporally isolated index (supports floating-point values)
function findMostIsolatedIndex(startTime) {
    var maxDistance = -1;
    var indexToDuplicate = -1;

    for (var i = 0; i < startTime.length; i++) {
        var prevDistance = i > 0 ? startTime[i] - startTime[i - 1] : Infinity;
        var nextDistance = i < startTime.length - 1 ? startTime[i + 1] - startTime[i] : Infinity;

        // The isolation is the smaller of the distances to neighbors
        var isolation = Math.min(prevDistance, nextDistance);

        if (isolation > maxDistance) {
            maxDistance = isolation;
            indexToDuplicate = i;
        }
    }
    return indexToDuplicate;
}

// Function to fill a buffer with the processed arrays
function fillBuffer(bufferName, startTime, pitch, velocity, duration) {
    var buffer = new Buffer(bufferName);

    if (!buffer) {
        error("Buffer " + bufferName + " not found.\n");
        return;
    }

    var bufferSize = maxNotes;
    buffer.send("sizeinsamps", bufferSize);

    for (var i = 0; i < bufferSize; i++) {
        buffer.poke(1, i, startTime[i]); // Channel 1: start_time
        buffer.poke(2, i, pitch[i]);    // Channel 2: pitch
        buffer.poke(3, i, velocity[i]); // Channel 3: velocity
        buffer.poke(4, i, duration[i]); // Channel 4: duration
    }
    outlet(0,"Buffer filled successfully with",bufferSize, "samples.\n");
    //post("Buffer filled successfully with " + bufferSize + " samples.\n");
}
