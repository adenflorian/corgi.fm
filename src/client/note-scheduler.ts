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

// Maybe range should only ever be a simple number, divisible by 10 or something
/** Must apply BPM on result */
export function getNotes(clip: MidiClip, initialRange: Range): MidiGlobalClipEvents {
	logger.trace('getNotes')
	if (clip.length <= 0) throw new Error('clip length must be > 0')

	return _getNotes(initialRange, 0)

	function _getNotes(range: Range, offset = 0): MidiGlobalClipEvents {
		if (range.length === 0) {
			return _checkSingleBeat(range.normalize(clip.length), offset)
		}

		if (range.length > 0) {
			return _checkBeatRange(range, offset)
		}

		throw createThisShouldntHappenError()
	}

	function _checkSingleBeat({start}: Range, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkSingleBeat')

		return clip.events.filter(x => {
			return x.startBeat === start
		})
			.map(x => ({note: x.note, startTime: 0 + _offset}))
	}

	function _checkBeatRange(_range: Range, _offset: number): MidiGlobalClipEvents {
		if (_rangeIsWithinBounds(_range)) {
			return _checkWithinClipBounds(_range.normalize(clip.length), _offset)
		} else {
			return _checkCrossingClipBounds(_range.normalize(clip.length), _offset)
		}
	}

	function _rangeIsWithinBounds(_range: Range) {
		if (_range.length <= clip.length) {
			const {start, end} = _range.normalize(clip.length)

			return 0 <= start && end <= clip.length
		} else {
			return false
		}
	}

	function _checkWithinClipBounds({start, end}: Range, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkWithinClipBounds')

		return clip.events.filter(x => {
			return start <= x.startBeat && x.startBeat < end
		})
			.map(x => ({note: x.note, startTime: x.startBeat - start + _offset}))
	}

	function _checkCrossingClipBounds(_range: Range, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkCrossingClipBounds')

		const newLength = clip.length - _range.start
		const newEnd = _range.start + newLength
		const excess = _range.end - newEnd

		const events = _checkWithinClipBounds(
			new Range(_range.start, newLength),
			_offset,
		)

		if (excess === 0) {
			return events
		} else {
			return events.concat(_getNotes(
				new Range(0, excess),
				_offset + clip.length - _range.start,
			))
		}
	}
}
