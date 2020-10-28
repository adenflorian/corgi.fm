import {IMidiNote} from '@corgifm/common/MidiNote'
// @ts-ignore
// eslint-disable-next-line import/no-internal-modules
import {getFrequencyUsingHalfStepsFromA4 as getFrequencyUsingHalfStepsFromA4Rust} from '../client-rust/lib.rs'

export function getFrequencyUsingHalfStepsFromA4(halfSteps: number): number {
	return getFrequencyUsingHalfStepsFromA4Rust(halfSteps)
}

export const A4 = 69

export function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}
