import {OrderedMap} from 'immutable'
import {logger} from '@corgifm/common/logger'
import {
	makeMidiGlobalClipEvent, MidiClip, MidiGlobalClipEvent,
	MidiGlobalClipEvents, midiPrecision, MidiRange, MidiClipEvent,
	preciseAdd, preciseSubtract, preciseModulus,
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

const emptyGlobalClipEvents = OrderedMap<Id, MidiGlobalClipEvent>()
const emptyMidiClipEvents = OrderedMap<Id, MidiClipEvent>()

// TODO Will this work for triplets?

// Maybe range should only ever be a simple number, divisible by 10 or something
/** Must apply BPM on result */
export function getEvents(clip: MidiClip, initialRange: MidiRange, rate: number, restartTime?: number): MidiGlobalClipEvents {
	logger.trace('getNotes')

	const adjustedClipLength = clip.length * rate

	if (adjustedClipLength <= 0) return emptyGlobalClipEvents

	const foo = _getNotes(initialRange, 0)

	if (restartTime === undefined) {
		return foo
	} else {
		return foo.concat(getEventsPlayingAtTime(clip, restartTime, rate))
	}

	function _getNotes(range: MidiRange, offset = 0): MidiGlobalClipEvents {
		if (range.length >= 0) {
			return _checkBeatRange(range, offset)
		}

		throw new Error('invalid range: ' + JSON.stringify(range))
	}

	function _checkBeatRange(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		if (_rangeIsWithinBounds(_range)) {
			return _checkWithinClipBounds(_range.normalize(adjustedClipLength), _offset)
		} else {
			return _checkCrossingClipBounds(_range.normalize(adjustedClipLength), _offset)
		}
	}

	function _rangeIsWithinBounds(_range: MidiRange) {
		if (_range.length <= adjustedClipLength) {
			const {start, end} = _range.normalize(adjustedClipLength)

			return start >= 0 && end <= adjustedClipLength
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
				const normalEndTime = preciseAdd(adjustedStartBeat, adjustedDurationBeats)
				const finalStartTime = preciseAdd(preciseSubtract(adjustedStartBeat, start), _offset)
				const finalDurationBeats = normalEndTime > adjustedClipLength
					? adjustedClipLength - adjustedStartBeat
					: adjustedDurationBeats
				return (makeMidiGlobalClipEvent({
					note: x.note,
					startTime: finalStartTime,
					endTime: preciseAdd(finalStartTime, finalDurationBeats),
					id: x.id,
				}))
			})
	}

	function _checkCrossingClipBounds(_range: MidiRange, _offset: number): MidiGlobalClipEvents {
		logger.trace('_checkCrossingClipBounds')

		const newLength = ((adjustedClipLength * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision
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
				((_offset * midiPrecision) + (adjustedClipLength * midiPrecision) - (_range.start * midiPrecision)) / midiPrecision,
			))
		}
	}
}

/**
 * Don't use the start or duration beats from returned events
 */
export function getEventsPlayingAtTime(
	clip: MidiClip, songBeatTime: number, rate: number,
): MidiGlobalClipEvents {

	const adjustedClipLength = clip.length * rate

	if (adjustedClipLength <= 0) return emptyGlobalClipEvents

	const clipBeat = songBeatToClipSpace(adjustedClipLength, songBeatTime, clip.loop)

	const distanceToEndOfClip = adjustedClipLength - clipBeat

	return clip.events
		.map(applyRateToEvent(rate))
		// start beat must be before clipBeat, scanner will handle notes starting at clip beat
		.filter(event => event.startBeat < clipBeat && eventEndBeat(event) > clipBeat)
		.map(event => {
			return makeMidiGlobalClipEvent({
				...event,
				startTime: 0,
				endTime: preciseSubtract(event.durationBeats, preciseSubtract(clipBeat, event.startBeat)),
			})
		})
		// Truncate event if it goes outside clip
		.map(event => {
			return event.endTime > distanceToEndOfClip
				? {
					...event,
					endTime: distanceToEndOfClip,
				}
				: event
		})
}

function songBeatToClipSpace(clipLength: number, songBeat: number, clipLoops: boolean) {
	if (clipLoops) {
		return preciseModulus(songBeat, clipLength)
	} else {
		return songBeat
	}
}

function applyRateToEvent(rate: number) {
	return (event: MidiClipEvent): MidiClipEvent => {
		return {
			...event,
			startBeat: event.startBeat * rate,
			durationBeats: event.durationBeats * rate,
		}
	}
}

function eventEndBeat(event: MidiClipEvent): number {
	return event.startBeat + event.durationBeats
}
