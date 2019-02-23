import {List, Record} from 'immutable'
import {createThisShouldntHappenError} from '../common/common-utils'
import {logger} from '../common/logger'

const precision = 1000000

export class Range {
	/** exclusive */
	public static readonly maxSafeNumber = 100000000
	public readonly end: number

	constructor(
		/** Always 0 or greater, defaults to 0 */
		public readonly start = 0,
		/** Always 0 or greater, defaults to 0 */
		public readonly length = 0,
	) {
		if (start < 0) throw new Error('start must be >= 0')
		if (length < 0) throw new Error('length must be >= 0')
		if (Math.max(this.start, this.start + this.length) >= Range.maxSafeNumber) {
			throw new Error('too big')
		}
		this.end = ((this.start * precision) + (this.length * precision)) / precision
	}

	public normalize(max: number) {
		return new Range(
			((this.start * precision) % (max * precision) / precision),
			this.length,
		)
	}
}

export interface MidiEvent {
	note: number
}

export interface MidiClipEvent extends MidiEvent {
	startBeat: number
}

export const makeMidiClip = Record({
	length: 4,
	loop: true,
	events: List<MidiClipEvent>(),
})

export type MidiClip = ReturnType<typeof makeMidiClip>

export type MidiClipEvents = MidiClip['events']

export interface MidiGlobalClipEvent extends MidiEvent {
	startTime: number
}

export const makeMidiGlobalClip = Record({
	length: 4,
	loop: true,
	events: List<MidiGlobalClipEvent>(),
})

export type MidiGlobalClip = ReturnType<typeof makeMidiGlobalClip>

export type MidiGlobalClipEvents = MidiGlobalClip['events']

export const applyBPM = (beat: number, bpm: number) => {
	return beat * (60 / bpm)
}

export const applyBPMMapper = (bpm: number) => (event: MidiGlobalClipEvent) => {
	return {
		...event,
		startTime: applyBPM(event.startTime, bpm),
	}
}

export function applyBPMToEvents(events: MidiGlobalClipEvents, bpm: number) {
	return events.map(applyBPMMapper(bpm))
}

export class NoteScheduler {
	constructor(
		private readonly _clip: MidiClip,
	) {
		if (this._clip.length <= 0) throw new Error(`clipLength must be > 0`)
	}

	// Maybe range should only ever be a simple number, divisible by 10 or something
	/** Must apply BPM on result */
	public getNotes(range: Range, offset = 0): MidiGlobalClipEvents {
		logger.trace('getNotes')
		if (range.length === 0) {
			return this._checkSingleBeat(range.normalize(this._clip.length), offset)
		}

		if (range.length > 0) {
			return this._checkBeatRange(range, offset)
		}

		throw createThisShouldntHappenError()
	}

	private _checkSingleBeat({start}: Range, offset: number): MidiGlobalClipEvents {
		logger.trace('_checkSingleBeat')

		return this._clip.events.filter(x => {
			return x.startBeat === start
		})
			.map(x => ({note: x.note, startTime: 0 + offset}))
	}

	private _checkBeatRange(range: Range, offset: number): MidiGlobalClipEvents {
		if (this._rangeIsWithinBounds(range)) {
			return this._checkWithinClipBounds(range.normalize(this._clip.length), offset)
		} else {
			return this._checkCrossingClipBounds(range.normalize(this._clip.length), offset)
		}
	}

	private _rangeIsWithinBounds(range: Range) {
		if (range.length <= this._clip.length) {
			const {start, end} = range.normalize(this._clip.length)

			return 0 <= start && end <= this._clip.length
		} else {
			return false
		}
	}

	private _checkWithinClipBounds({start, end}: Range, offset: number): MidiGlobalClipEvents {
		logger.trace('_checkWithinClipBounds')

		return this._clip.events.filter(x => {
			return start <= x.startBeat && x.startBeat < end
		})
			.map(x => ({note: x.note, startTime: x.startBeat - start + offset}))
	}

	private _checkCrossingClipBounds(range: Range, offset: number): MidiGlobalClipEvents {
		logger.trace('_checkCrossingClipBounds')

		const newLength = this._clip.length - range.start
		const newEnd = range.start + newLength
		const excess = range.end - newEnd

		const events = this._checkWithinClipBounds(
			new Range(range.start, newLength),
			offset,
		)

		if (excess === 0) {
			return events
		} else {
			return events.concat(this.getNotes(
				new Range(0, excess),
				offset + this._clip.length - range.start,
			))
		}
	}
}
