import {List, Record} from 'immutable'
import {isEqual} from 'lodash'
import {createThisShouldntHappenError} from '../common/common-utils'
import {logger} from '../common/logger'

/*
looping is hard
i would like a way to abstract away the fact that it loops from as much of this logic as possible
i got looping kind of working, but its not perfect and has edge cases that fail
the only thing that really needs to know about looping is the thing that reads the events, or provides the events
i wonder if i can make some kind of  stream that has events fed in from the original clip
	but with the times altered according to bpm and looping and stuff

midiClipStreamReader
- getNextEvent() => {startBeat: 1/4, note: 60}
- readBeats(0.5 beats) => {startBeat: 1/4, note: 60}
- getEventsInRange(start, end) => [{startTime: 1230.0, note: 60}, {startTime: 1231.5, note: 62}]
should the reader return events in the context of the midi clip or in the context of the song/app/scheduler?
what is needed to convert from clip context to global?
- current time
- bpm
- clip length?

clip
- length: 2
- events: [0.0, 0.25, 1.0, 1.5, 1.99]

g = global time
c = clip time
L - clip length

g    | c
0.00 | 0.00
0.25 | 0.25
1.00 | 1.00
1.50 | 1.50
1.99 | 1.99
2.00 | 0.00
2.25 | 0.25
3.00 | 1.00
3.99 | 1.99
4.00 | 0.00
5.00 | 1.00
6.00 | 0.00

c = f(g) = g % L

midiClipStreamReader needs to keep track of loop count

a system that use the midiClipStreamReader
scheduler

*/

export interface MidiEvent {
	startBeat: number,
	note: number
}

export const makeMidiClip = Record({
	length: 4,
	loop: true,
	events: List<MidiEvent>(),
})

export type MidiEvents = MidiClip['events']

export type MidiClip = ReturnType<typeof makeMidiClip>

// Maybe range should only ever be a simple number, divisible by 10 or something
export function getNotes(start: number, end: number, clip: MidiClip): MidiEvents {
	const clipLength = clip.length
	const bigStart = start * 1000
	const bigEnd = end * 1000
	const bigClipLength = clipLength * 1000
	const rangeLength = end - start

	if (rangeLength < 0) throw new Error(`start time must be <= end time`)
	if (clipLength <= 0) throw new Error(`clipLength must be > 0`)
	if (start < 0) throw new Error('start time must be >= 0')

	const clipEventStart = bigStart % bigClipLength

	if (rangeLength === 0) {
		return clip.events.filter(x => {
			return x.startBeat * 1000 === clipEventStart
		})
	}

	if (rangeLength > 0) {
		if (rangeLength <= clipLength) {
			if (start === 0 || end <= clipLength) {
				return clip.events.filter(x => {
					return start <= x.startBeat && x.startBeat < end
				})
			} else {
				return List()
			}
		} else {
			return List() // TODO
		}
	}

	throw createThisShouldntHappenError()
}
