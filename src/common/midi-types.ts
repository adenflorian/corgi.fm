import {List, Record} from 'immutable'
import {IMidiNotes} from './MidiNote'

// Start Clip Midi Types

/** In clip time (beats); Means BPM has not been applied */
export interface MidiClipEvent {
	notes: IMidiNotes
	startBeat: number
	durationBeats: number
}

/** In clip time (beats); Means BPM has not been applied */
export function makeMidiClipEvent(event: MidiClipEvent): Readonly<MidiClipEvent> {
	if (event.notes === undefined) throw new Error('why')
	if (event.startBeat === undefined) throw new Error('why')
	if (event.durationBeats === undefined) throw new Error('why')

	return Object.freeze({
		notes: event.notes,
		startBeat: event.startBeat,
		durationBeats: event.durationBeats,
	})
}

const makeMidiClip = Record({
	length: 0,
	loop: false,
	events: List<MidiClipEvent>(),
})

/** In clip time (beats); Means BPM has not been applied */
export class MidiClip extends makeMidiClip {}

/** In clip time (beats); Means BPM has not been applied */
export type MidiClipEvents = MidiClip['events']

// Start Global Midi Types

/** In audio context time (seconds); Means BPM is already applied */
export interface MidiGlobalClipEvent {
	notes: IMidiNotes
	startTime: number
	endTime: number
}

export function makeMidiGlobalClipEvent(event: MidiGlobalClipEvent): Readonly<MidiGlobalClipEvent> {
	if (event.notes === undefined) throw new Error('why')
	if (event.startTime === undefined) throw new Error('why')
	if (event.endTime === undefined) throw new Error('why')

	return Object.freeze({
		notes: event.notes,
		startTime: event.startTime,
		endTime: event.endTime,
	})
}

/** In audio context time (seconds); Means BPM is already applied */
export const makeMidiGlobalClip = Record({
	length: 4,
	loop: true,
	events: List<MidiGlobalClipEvent>(),
})

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClip = ReturnType<typeof makeMidiGlobalClip>

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClipEvents = MidiGlobalClip['events']

// Midi Range

/** Multiply things by  this number before doing math with it */
export const midiPrecision = 1000000

export class MidiRange {
	/** exclusive */
	public static readonly maxSafeNumber = 100000000
	public readonly end: number

	constructor(
		/** Always 0 or greater, defaults to 0 */
		public readonly start = 0,
		/** Always 0 or greater, defaults to 0 */
		public readonly length = 0,
	) {
		if (start < 0) throw new Error('start must be >= 0 | ' + JSON.stringify(this))
		if (length < 0) throw new Error('length must be >= 0 | ' + JSON.stringify(this))

		if (start === null || length === null) throw new Error('y r u null | ' + JSON.stringify(this))

		if (Math.max(this.start, this.start + this.length) >= MidiRange.maxSafeNumber) {
			throw new Error('too big | ' + JSON.stringify(this))
		}
		this.end = ((this.start * midiPrecision) + (this.length * midiPrecision)) / midiPrecision
	}

	public normalize(max: number) {
		return new MidiRange(
			((this.start * midiPrecision) % (max * midiPrecision) / midiPrecision),
			this.length,
		)
	}
}
