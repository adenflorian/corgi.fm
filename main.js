var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var oscillator = audioCtx.createOscillator();
var gainNode = audioCtx.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var maxFreq = 6000;
var maxVol = 1;

var initialFreq = 400;
var offVol = 0.0;
var onVolume = 0.1;

// set options for the oscillator

oscillator.type = 'sawtooth'; // sine wave — other values are 'square', 'sawtooth', 'triangle' and 'custom'
oscillator.frequency.value = initialFreq; // value in hertz
oscillator.start();

gainNode.gain.value = offVol;

const halfStepMap = {
    a: 0,   // white
    w: 1,   // black
    s: 2,   // white
    e: 3,   // black
    d: 4,   // white
    f: 5,   // white
    t: 6,   // black
    g: 7,   // white
    y: 8,   // black
    h: 9,   // white
    u: 10,   // black
    j: 11,   // white
    k: 12,   // white
    o: 13,   // black
    l: 14,   // white
    p: 15,   // black
}

/** @param {string} keyname */
function isMidiKey(keyname) {
    return halfStepMap[keyname.toLowerCase()] !== undefined;
}


/** @param {number} steps */
function getFrequencyUsingStepsFromA4(steps) {
    const fixedNoteFrequency = 440
    const twelthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

    return fixedNoteFrequency * Math.pow(twelthRootOf2, steps);
}

/**
 * 
 * 
 * 
A4	        440.00
A#4/Bb4  	466.16
B4	        493.88
C5	        523.25
C#5/Db5  	554.37
D5	        587.33
D#5/Eb5  	622.25
E5	        659.25
F5	        698.46
F#5/Gb5  	739.99
G5	        783.99
G#5/Ab5  	830.61
 */

window.addEventListener('keydown', (e) => {
    const keyname = e.key;

    if (isMidiKey(keyname) === false) return;

    const halfSteps = halfStepMap[keyname];
    const freq = getFrequencyUsingStepsFromA4(halfSteps);

    oscillator.frequency.value = freq;
    gainNode.gain.value = onVolume;
})

window.addEventListener('keyup', () => {
    gainNode.gain.value = offVol;
})
