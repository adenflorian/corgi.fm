/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {toBeats, fromBeats} from '@corgifm/common/common-utils'
import {preciseSubtract, preciseAdd, midiPrecision} from '@corgifm/common/midi-types'
import {logger} from '../../client-logger'
import {ExpCustomNumberParam, buildCustomNumberParamDesc} from '../ExpParams'
import {ExpGateOutputPort} from '../ExpGatePorts'
import {CorgiNode} from '../CorgiNode'

interface GateEvent {
	readonly gate: boolean
	readonly beat: number
}

interface NextEvent extends GateEvent {
	readonly distanceFromMainCursor: number
}

const myPrecision = 1000

// TODO Good candidate for writing in Rust?
class EventStreamReader {
	private _beatCursor = 0
	private readonly _eventStream = new EventStream()
	private _currentEvent: GateEvent

	public constructor() {
		this._currentEvent = this._eventStream.getNextEvent()
	}

	public read(beatsToRead: number): readonly NextEvent[] {
		if (beatsToRead <= 0) {
			return []
		}

		const readEvents: NextEvent[] = []

		let distanceFromMainCursor = Math.round((this._currentEvent.beat - this._beatCursor) * midiPrecision) / midiPrecision

		if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no A: ', {distanceFromMainCursor, ceb: this._currentEvent.beat, bc: this._beatCursor})

		while (distanceFromMainCursor < beatsToRead) {
			readEvents.push({
				...this._currentEvent,
				distanceFromMainCursor,
			})
			this._currentEvent = this._eventStream.getNextEvent()
			distanceFromMainCursor = Math.round((this._currentEvent.beat - this._beatCursor) * midiPrecision) / midiPrecision
			if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no B: ', {distanceFromMainCursor, ceb: this._currentEvent.beat, bc: this._beatCursor})
		}

		this._beatCursor = Math.round((this._beatCursor + beatsToRead) * myPrecision) / myPrecision

		return readEvents
	}
}

class EventStream {
	public readonly beatLength = 4
	private _currentIndex = -1
	private _loops = 0
	private readonly _events: readonly GateEvent[] = [
		{gate: true, beat: 0},
		{gate: false, beat: 1},
		{gate: true, beat: 2},
		{gate: false, beat: 3},
	]

	public getNextEvent(): GateEvent {
		this._currentIndex++

		if (this._currentIndex >= this._events.length) {
			this._loops++
			this._currentIndex = 0
		}

		const nextEvent = this._events[this._currentIndex]

		return {
			...nextEvent,
			beat: nextEvent.beat + (this._loops * this.beatLength),
		}
	}
}

export class SequencerNode extends CorgiNode {
	private _cursor: number
	private readonly _eventStream: EventStreamReader
	private readonly _gateOutputPort: ExpGateOutputPort
	private _startSongTime: number

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const gateOutputPort = new ExpGateOutputPort('output', 'output', () => this)

		super(id, audioContext, preMasterLimiter, {
			ports: [gateOutputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
				// TODO Store in private class field
				buildCustomNumberParamDesc('tempo', 240, 0.001, 999.99, 3),
				buildCustomNumberParamDesc('noteLength', 1, 0.001, 2, 3),
			]),
		})

		this._startSongTime = -1

		this._gateOutputPort = gateOutputPort

		this._cursor = 0
		this._eventStream = new EventStreamReader()

		// Make sure to add these to the dispose method!
	}

	public getColor(): string {return CssColor.green}
	public getName() {return 'Sequencer'}

	private get _tempo() {return this._customNumberParams.get('tempo')!.value}
	private get _noteLength() {return this._customNumberParams.get('noteLength')!.value}

	public render() {return this.getDebugView()}

	public onTick(currentGlobalTime: number, maxReadAhead: number) {
		super.onTick(currentGlobalTime, maxReadAhead)

		if (this._startSongTime < 0) {
			this._startSongTime = Math.ceil((currentGlobalTime + 0.1) * 10) / 10
		}
		const cursor = this._cursor
		const songStartTime = this._startSongTime
		const tempo = this._tempo
		const currentSongTime = preciseSubtract(currentGlobalTime, songStartTime)
		const targetSongTimeToReadTo = Math.ceil(preciseAdd(currentSongTime, maxReadAhead) * myPrecision) / myPrecision
		const distanceSeconds = Math.round(preciseSubtract(targetSongTimeToReadTo, cursor) * myPrecision) / myPrecision
		if (distanceSeconds <= 0) return
		const distanceBeats = toBeats(distanceSeconds, tempo)
		const events = this._eventStream.read(distanceBeats)
		events.forEach(event => {
			const eventDistanceFromCursor = event.distanceFromMainCursor
			const fromBeats_ = fromBeats(eventDistanceFromCursor, tempo)
			const songStartPlusCursor = Math.round((songStartTime + cursor) * myPrecision) / myPrecision
			const eventStart = Math.round((songStartPlusCursor + fromBeats_) * myPrecision) / myPrecision
			const diff = preciseSubtract(eventStart, songStartTime)
			const leadTime = eventStart - currentGlobalTime
			const data = {gate: event.gate, eventStart, songStartTime, cursor, eventDistanceFromCursor, tempo, fromBeats_, songStartPlusCursor, diff, event, leadTime}
			if (eventStart.toString().length > 8) logger.warn('precision error oh no: ', data)
			// logger.log(`gate:`, data)
			this._gateOutputPort.sendGateSignal(event.gate, eventStart)
		})
		this._cursor = targetSongTimeToReadTo
	}

	protected _enable() {
		// TODO
	}

	protected _disable() {
		// TODO
	}

	protected _dispose() {
		// TODO?
	}
}
