import {List, Set} from 'immutable'
import {makeMidiClipEvent, MidiClip} from '@corgifm/common/midi-types'

export const shortDemoMidiClip = new MidiClip({
	length: 2,
	loop: true,
	events: List([
		makeMidiClipEvent({
			startBeat: 0,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 0,
			durationBeats: 1 / 8,
			notes: Set([48]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 4,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
	]),
})

export const longDemoMidiClip = new MidiClip({
	length: 8,
	loop: true,
	events: List([
		makeMidiClipEvent({
			startBeat: 0,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 4,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 + 2,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 8 + 2,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 + 3,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 8 + 3,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 8 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 9 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 10 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 11 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 12 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 13 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 14 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 15 / 16 + 4,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 0 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 1 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 2 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 3 + 6,
			durationBeats: 1 / 8,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 0 / 3 + 7,
			durationBeats: 4 / 8,
			notes: Set([74]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 + 7,
			durationBeats: 4 / 8,
			notes: Set([70]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 + 7,
			durationBeats: 4 / 8,
			notes: Set([67]),
		}),
	]),
})
