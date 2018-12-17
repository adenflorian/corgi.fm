export function applyOctave(midiNumber: number, octave: number) {
	if (octave === -1) return midiNumber

	return midiNumber + (octave * 12) + 12
}

export function getFrequencyUsingHalfStepsFromA4(halfSteps: number) {
	const fixedNoteFrequency = 440
	const twelfthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelfthRootOf2, halfSteps)
}
