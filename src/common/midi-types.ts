import {List, Record, Set} from 'immutable'
import {IMidiNotes} from './MidiNote'

/** In clip time (beats); Means BPM has not been applied */
export interface MidiClipEvent {
	startBeat: number
	notes: IMidiNotes
}

/** In clip time (beats); Means BPM has not been applied */
export function makeMidiClipEvent(event: MidiClipEvent): Readonly<MidiClipEvent> {
	const actualNotes = event.notes !== undefined
		? event.notes
		: Set()

	return Object.freeze({
		startBeat: event.startBeat || 0,
		notes: actualNotes,
	})
}

export function makeMidiGlobalClipEvent(event: MidiGlobalClipEvent): Readonly<MidiGlobalClipEvent> {
	const actualNotes = event.notes !== undefined
		? event.notes
		: Set()

	return Object.freeze({
		startTime: event.startTime || 0,
		notes: actualNotes,
	})
}

/** In clip time (beats); Means BPM has not been applied */
export const makeMidiClip = Record({
	length: 0,
	loop: false,
	events: List<MidiClipEvent>(),
})

/** In clip time (beats); Means BPM has not been applied */
export type MidiClip = ReturnType<typeof makeMidiClip>

/** In clip time (beats); Means BPM has not been applied */
export type MidiClipEvents = MidiClip['events']

export interface MidiGlobalClipEvent {
	startTime: number
	notes: IMidiNotes
}

export const makeMidiGlobalClip = Record({
	length: 4,
	loop: true,
	events: List<MidiGlobalClipEvent>(),
})

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClip = ReturnType<typeof makeMidiGlobalClip>

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClipEvents = MidiGlobalClip['events']

const precision = 1000000

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
		this.end = ((this.start * precision) + (this.length * precision)) / precision
	}

	public normalize(max: number) {
		return new MidiRange(
			((this.start * precision) % (max * precision) / precision),
			this.length,
		)
	}
}
