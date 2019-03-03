import {logger} from '../common/logger'
import {
	makeMidiGlobalClipEvent, MidiClip, MidiGlobalClipEvent, MidiGlobalClipEvents, midiPrecision, MidiRange,
} from '../common/midi-types'

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

// Maybe range should only ever be a simple number, divisible by 10 or something
/** Must apply BPM on result */
export function getEvents(clip: MidiClip, initialRange: MidiRange): MidiGlobalClipEvents {
	logger.trace('getNotes')
	if (clip.length <= 0) throw new Error('clip length must be > 0: ' + JSON.stringify(clip))

	return _getNotes(initialRange, 0)

	function _getNotes(range: MidiRange, offset = 0): MidiGlobalClipEvents {
		if (range.length === 0) {
			return _checkSingleBeat(range.normalize(clip.length), offset)
		}

		if (range.length > 0) {
			return _checkBeatRange(range, offset)
		}

		throw new Error('invalid range: ' + JSON.stringify(range))
	}

	function _checkSingleBeat({start}: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkSingleBeat')

		return clip.events.filter(x => {
			return x.startBeat === start
		})
			.map(x => (makeMidiGlobalClipEvent({
				notes: x.notes,
				startTime: _offset,
				endTime: ((_offset * midiPrecision) + (x.durationBeats * midiPrecision)) / midiPrecision,
			})))
	}

	function _checkBeatRange(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		if (_rangeIsWithinBounds(_range)) {
			return _checkWithinClipBounds(_range.normalize(clip.length), _offset)
		} else {
			return _checkCrossingClipBounds(_range.normalize(clip.length), _offset)
		}
	}

	function _rangeIsWithinBounds(_range: MidiRange) {
		if (_range.length <= clip.length) {
			const {start, end} = _range.normalize(clip.length)

			return 0 <= start && end <= clip.length
		} else {
			return false
		}
	}

	function _checkWithinClipBounds({start, end}: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkWithinClipBounds')

		return clip.events.filter(x => {
			return start <= x.startBeat && x.startBeat < end
		})
			.map(x => (makeMidiGlobalClipEvent({
				notes: x.notes,
				startTime: ((x.startBeat * midiPrecision) - (start * midiPrecision) + (_offset * midiPrecision)) / midiPrecision,
				endTime: ((x.startBeat * midiPrecision) - (start * midiPrecision) + (_offset * midiPrecision) + (x.durationBeats * midiPrecision)) / midiPrecision, // TODO
			})))
	}

	function _checkCrossingClipBounds(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkCrossingClipBounds')

		const newLength = ((clip.length * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision
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
				((_offset * midiPrecision) + (clip.length * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision,
			))
		}
	}
}
