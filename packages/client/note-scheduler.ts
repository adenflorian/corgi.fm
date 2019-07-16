import {List} from 'immutable'
import {logger} from '@corgifm/common/logger'
import {
	makeMidiGlobalClipEvent, MidiClip, MidiGlobalClipEvent, MidiGlobalClipEvents, midiPrecision, MidiRange,
} from '@corgifm/common/midi-types'

export const applyBPM = (beat: number, bpm: number) => {
	return ((beat * midiPrecision) * ((60 * midiPrecision) / (bpm * midiPrecision))) / midiPrecision
}

export const applyBPMMapper = (bpm: number) => (event: MidiGlobalClipEvent) => {
	return {
		...event,
		startTime: applyBPM(event.startTime, bpm),
		endTime: applyBPM(event.endTime, bpm),
	}
}

export function applyBPMToEvents(events: MidiGlobalClipEvents, bpm: number) {
	return events.map(applyBPMMapper(bpm))
}

const emptyGlobalClipEvents = List()

// TODO Will this work for triplets?

// Maybe range should only ever be a simple number, divisible by 10 or something
/** Must apply BPM on result */
export function getEvents(clip: MidiClip, initialRange: MidiRange, rate: number): MidiGlobalClipEvents {
	logger.trace('getNotes')

	const clipLength = clip.length * rate

	if (clipLength <= 0) return emptyGlobalClipEvents

	return _getNotes(initialRange, 0)

	function _getNotes(range: MidiRange, offset = 0): MidiGlobalClipEvents {
		if (range.length >= 0) {
			return _checkBeatRange(range, offset)
		}

		throw new Error('invalid range: ' + JSON.stringify(range))
	}

	function _checkBeatRange(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		if (_rangeIsWithinBounds(_range)) {
			return _checkWithinClipBounds(_range.normalize(clipLength), _offset)
		} else {
			return _checkCrossingClipBounds(_range.normalize(clipLength), _offset)
		}
	}

	function _rangeIsWithinBounds(_range: MidiRange) {
		if (_range.length <= clipLength) {
			const {start, end} = _range.normalize(clipLength)

			return 0 <= start && end <= clipLength
		} else {
			return false
		}
	}

	function _checkWithinClipBounds({start, end}: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkWithinClipBounds')

		return clip.events.filter(x => {
			const adjustedStartBeat = x.startBeat * rate
			return start === end
				? start === adjustedStartBeat
				: start <= adjustedStartBeat && adjustedStartBeat < end
		})
			.map(x => {
				const adjustedStartBeat = x.startBeat * rate
				const adjustedDurationBeats = x.durationBeats * rate
				return (makeMidiGlobalClipEvent({
					notes: x.notes,
					startTime: ((adjustedStartBeat * midiPrecision) - (start * midiPrecision) + (_offset * midiPrecision)) / midiPrecision,
					endTime: ((adjustedStartBeat * midiPrecision) - (start * midiPrecision) + (_offset * midiPrecision) + (adjustedDurationBeats * midiPrecision)) / midiPrecision, // TODO
				}))
			})
	}

	function _checkCrossingClipBounds(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkCrossingClipBounds')

		const newLength = ((clipLength * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision
		const newEnd = ((_range.start * midiPrecision) + (newLength * midiPrecision)) / midiPrecision
		const excess = ((_range.end * midiPrecision) - (newEnd * midiPrecision)) / midiPrecision

		const events = _checkWithinClipBounds(
			new MidiRange(_range.start, newLength),
			_offset,
		)

		if (excess === 0) {
			return events
		} else {
			return events.concat(_getNotes(
				new MidiRange(0, excess),
				((_offset * midiPrecision) + (clipLength * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision,
			))
		}
	}
}
