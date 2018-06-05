const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

const oscillator = audioCtx.createOscillator()
const gainNode = audioCtx.createGain()

oscillator.connect(gainNode)
gainNode.connect(audioCtx.destination)

const offVolume = 0.0
const onVolume = 0.1

oscillator.type = 'sawtooth' // sine wave — other values are 'square', 'sawtooth', 'triangle' and 'custom'
oscillator.start()

gainNode.gain.value = offVolume

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
	return halfStepMap[keyname.toLowerCase()] !== undefined
}

/** @param {number} steps */
function getFrequencyUsingStepsFromA4(steps) {
	const fixedNoteFrequency = 440
	const twelthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelthRootOf2, steps)
}

window.addEventListener('keydown', (e) => {
	const keyname = e.key

	if (isMidiKey(keyname) === false) return

	const halfSteps = halfStepMap[keyname]
	const freq = getFrequencyUsingStepsFromA4(halfSteps)

	oscillator.frequency.value = freq
	gainNode.gain.value = onVolume
})

window.addEventListener('keyup', () => {
	gainNode.gain.value = offVolume
})
