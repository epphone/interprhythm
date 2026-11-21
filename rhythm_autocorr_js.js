// Max/MSP JavaScript (js) object code
// Generates velocities from rhythm onset autocorrelation

autowatch = 1;

// Global variables
var resolution = 960;
var min_velocity = 40;
var max_velocity = 127;
var num_peaks = 5;
var min_lag = 8;

// Set parameters via messages
function setresolution(n) { resolution = Math.max(1, n); }
function setminvel(n) { min_velocity = Math.max(1, Math.min(127, n)); }
function setmaxvel(n) { max_velocity = Math.max(1, Math.min(127, n)); }
function setnumpeaks(n) { num_peaks = Math.max(1, n); }
function setminlag(n) { min_lag = Math.max(1, n); }

// Main function: accepts list of onsets, outputs velocities
function list() {
    var onsets = arrayfromargs(arguments);
    
    if (onsets.length === 0) {
        post("No onsets provided\n");
        return;
    }
    
    post("Processing " + onsets.length + " onsets\n");
    
    // Create binary onset vector
    var onset_vector = new Array(resolution);
    for (var i = 0; i < resolution; i++) {
        onset_vector[i] = 0;
    }
    
    for (var i = 0; i < onsets.length; i++) {
        var onset = Math.floor(onsets[i]);
        if (onset >= 0 && onset < resolution) {
            onset_vector[onset] = 1;
        }
    }
    
    // Compute autocorrelation
    var autocorr = computeAutocorrelation(onset_vector);
    
    // Normalize autocorrelation
    if (autocorr[0] > 0) {
        for (var i = 0; i < autocorr.length; i++) {
            autocorr[i] = autocorr[i] / autocorr[0];
        }
    }
    
    // Find peaks
    var peaks = findPeaks(autocorr, min_lag);
    
    // Sort peaks by strength and take top N
    peaks.sort(function(a, b) { return b.strength - a.strength; });
    var top_peaks = peaks.slice(0, Math.min(num_peaks, peaks.length));
    
    post("Found " + peaks.length + " peaks in autocorrelation\n");
    post("Top periods (lags): ");
    for (var i = 0; i < top_peaks.length; i++) {
        post(top_peaks[i].lag + " ");
    }
    post("\n");
    
    // Generate velocities
    var velocities = generateVelocities(onsets, top_peaks);
    
    // Output velocities
    // Format: onset1 velocity1 onset2 velocity2 ...
    var output = [];
    for (var i = 0; i < velocities.length; i++) {
        output.push(velocities[i].onset);
        output.push(velocities[i].velocity);
    }
    
    outlet(0, output);
    
    // Optional: output peaks to second outlet if you want to analyze them
    if (jsarguments.length > 1) {
        var peak_output = [];
        for (var i = 0; i < top_peaks.length; i++) {
            peak_output.push(top_peaks[i].lag);
            peak_output.push(top_peaks[i].strength);
        }
        outlet(1, peak_output);
    }
}

// Compute autocorrelation (positive lags only)
function computeAutocorrelation(vec) {
    var n = vec.length;
    var result = new Array(n);
    
    for (var lag = 0; lag < n; lag++) {
        var sum = 0;
        for (var i = 0; i < n - lag; i++) {
            sum += vec[i] * vec[i + lag];
        }
        result[lag] = sum;
    }
    
    return result;
}

// Find peaks in autocorrelation function
function findPeaks(autocorr, min_lag) {
    var peaks = [];
    
    for (var i = min_lag; i < autocorr.length - 1; i++) {
        if (autocorr[i] > autocorr[i-1] && autocorr[i] > autocorr[i+1]) {
            peaks.push({
                lag: i,
                strength: autocorr[i]
            });
        }
    }
    
    return peaks;
}

// Generate velocities based on periodicity alignment
function generateVelocities(onsets, peaks) {
    var velocities = [];
    
    for (var i = 0; i < onsets.length; i++) {
        var onset = onsets[i];
        var accent_strength = 0;
        
        // Check alignment with each discovered period
        for (var j = 0; j < peaks.length; j++) {
            var period = peaks[j].lag;
            var strength = peaks[j].strength;
            
            // How close is this onset to a multiple of the period?
            var phase = onset % period;
            // Closest distance to period boundary
            var distance_to_beat = Math.min(phase, period - phase);
            // Normalize by period length
            var alignment = 1 - (distance_to_beat / (period / 2));
            // Weight by autocorrelation strength
            accent_strength += alignment * strength;
        }
        
        // Normalize accent strength
        if (peaks.length > 0) {
            accent_strength /= peaks.length;
        }
        
        // Map to velocity range
        var velocity = Math.floor(min_velocity + accent_strength * (max_velocity - min_velocity));
        velocity = Math.max(min_velocity, Math.min(max_velocity, velocity));
        
        velocities.push({
            onset: onset,
            velocity: velocity
        });
    }
    
    return velocities;
}

// Helper function
function arrayfromargs(args) {
    var arr = [];
    for (var i = 0; i < args.length; i++) {
        arr.push(args[i]);
    }
    return arr;
}

// Info message
function bang() {
    post("Rhythm Autocorrelation Velocity Generator\n");
    post("Settings: resolution=" + resolution + 
         ", min_vel=" + min_velocity + 
         ", max_vel=" + max_velocity +
         ", num_peaks=" + num_peaks +
         ", min_lag=" + min_lag + "\n");
    post("Send list of onsets to process\n");
}