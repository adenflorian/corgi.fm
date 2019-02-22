import {List, Record} from 'immutable'
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
- getEventsInRange(range) => [{startTime: 1230.0, note: 60}, {startTime: 1231.5, note: 62}]
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

// Max safe end number ~100,000,000
export class Range {
	/** exclusive */
	public static readonly maxSafeNumber = 100000000
	public readonly start: number
	public readonly end: number

	constructor(
		start: number,
		end?: number,
	) {
		this.start = start
		this.end = end === undefined ? start : end
		if (Math.max(this.start, this.end) >= Range.maxSafeNumber) {
			throw new Error('too big')
		}
	}

	public get length() {
		return this.end - this.start
	}

	public normalize(max: number) {
		const x = 1000000
		return new Range(
			((this.start * x) % (max * x) / x),
			((this.end * x) % (max * x) / x),
		)
	}
}

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

// TODO * 1000 is gonna fail eventually, need something more robust
export class NoteScheduler {
	constructor(
		private readonly _clip: MidiClip,
	) {}

	// Maybe range should only ever be a simple number, divisible by 10 or something
	public getNotes(range: Range): MidiEvents {
		this._validateArgs(range)

		if (range.length === 0) {
			return this._checkSingleBeat(range.start)
		}

		if (range.length > 0) {
			return this._checkBeatRange(range)
		}

		throw createThisShouldntHappenError()
	}

	private _validateArgs({start, end}: Range) {
		if (start > end) throw new Error(`start time must be <= end time`)
		if (this._clip.length <= 0) throw new Error(`clipLength must be > 0`)
		if (start < 0) throw new Error('start time must be >= 0')
	}

	private _checkSingleBeat(start: number): MidiEvents {
		logger.log('_checkSingleBeat')
		const clipEventStart = (start * 1000) % (this._clip.length * 1000)

		return this._clip.events.filter(x => {
			return x.startBeat * 1000 === clipEventStart
		})
	}

	private _checkBeatRange(range: Range): MidiEvents {
		if (this._rangeIsWithinBounds(range)) {
			return this._checkWithinClipBounds(range)
		} else {
			return this._checkCrossingClipBounds(range)
		}
	}

	private _rangeIsWithinBounds(range: Range) {
		// if (range.length <= this._clip.length) {
		// 	const normalizedRange =
		// }
		return range.length <= this._clip.length
			&& (range.start === 0 || range.end <= this._clip.length)
	}

	private _checkWithinClipBounds({start, end}: Range): MidiEvents {
		logger.log('_checkWithinClipBounds')
		return this._clip.events.filter(x => {
			return start <= x.startBeat && x.startBeat < end
		})
	}

	private _checkCrossingClipBounds({start, end}: Range): MidiEvents {
		logger.log('_checkCrossingClipBounds')
		return List()
	}
}
