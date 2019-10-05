/* eslint-disable no-empty-function */
import {ExpNodeType} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {toBeats, fromBeats} from '@corgifm/common/common-utils'
import {preciseSubtract, preciseAdd, midiPrecision} from '@corgifm/common/midi-types'
import {logger} from '../client-logger'
import {
	percentageValueString, filterValueToString,
	panValueToString, adsrValueToString, gainDecibelValueToString,
} from '../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort,
} from './ExpPorts'
import {CorgiNode} from './CorgiNode'
import {
	ExpAudioParam, buildAudioParamDesc,
	ExpCustomNumberParam, buildCustomNumberParamDesc,
} from './ExpParams'
import './ExpNodes.less'
import {ExpGateInputPort, ExpGateOutputPort} from './ExpGatePorts'

export class OscillatorExpNode extends CorgiNode {
	private readonly _oscillator: OscillatorNode
	private readonly _outputGain: GainNode
	private readonly _frequencyPort: ExpNodeAudioInputPort
	private readonly _detunePort: ExpNodeAudioInputPort
	private readonly _outputPort: ExpNodeAudioOutputPort

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const oscillator = audioContext.createOscillator()
		oscillator.frequency.value = 110
		oscillator.type = 'triangle'
		oscillator.start()
		const outputGain = audioContext.createGain()
		oscillator.connect(outputGain)

		const frequencyPort = new ExpNodeAudioInputPort('frequency', 'frequency', () => this, oscillator.frequency)
		const detunePort = new ExpNodeAudioInputPort('detune', 'detune', () => this, oscillator.detune)
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, outputGain)

		super(id, audioContext, preMasterLimiter, {
			ports: [frequencyPort, detunePort, outputPort],
			audioParams: new Map<Id, ExpAudioParam>([
				buildAudioParamDesc('frequency', oscillator.frequency, 440, 0, 20000, 3, filterValueToString),
				buildAudioParamDesc('detune', oscillator.detune, 0, -100, 100, 1, filterValueToString),
			]),
		})

		this._frequencyPort = frequencyPort
		this._detunePort = detunePort
		this._outputPort = outputPort

		// Make sure to add these to the dispose method!
		this._oscillator = oscillator
		this._outputGain = outputGain
	}

	public getColor(): string {
		return CssColor.green
	}

	public getName() {return 'Oscillator'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._outputGain.gain.value = 1
	}

	protected _disable() {
		this._outputGain.gain.value = 0
	}

	protected _dispose() {
		this._oscillator.stop()
		this._oscillator.disconnect()
		this._outputGain.disconnect()
	}
}

export class AudioOutputExpNode extends CorgiNode {
	private readonly _inputGain: GainNode
	private readonly _inputPort: ExpNodeAudioInputPort

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const inputGain = audioContext.createGain()

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, inputGain)

		super(id, audioContext, preMasterLimiter, {ports: [inputPort]})

		this._inputPort = inputPort

		inputGain.connect(audioContext.destination)
		// inputGain.connect(this.preMasterLimiter)

		// Make sure to add these to the dispose method!
		this._inputGain = inputGain
	}

	public getName() {return 'Audio Output'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._inputGain.gain.value = 1
	}

	protected _disable() {
		this._inputGain.gain.value = 0
	}

	protected _dispose() {
		this._inputGain.disconnect()
	}
}

export class DummyNode extends CorgiNode {
	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		super(id, audioContext, preMasterLimiter)
	}

	public getColor(): string {
		return CssColor.disabledGray
	}

	public getName() {return 'Dummy'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
	}

	protected _disable() {
	}

	protected _dispose() {
		logger.log('dispose DummyNode')
	}
}

export class FilterNode extends CorgiNode {
	private readonly _filter: BiquadFilterNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const filter = audioContext.createBiquadFilter()
		filter.frequency.value = 150

		const dryWetChain = new DryWetChain(audioContext, filter)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const frequencyPort = new ExpNodeAudioInputPort('frequency', 'frequency', () => this, filter.frequency)
		const detunePort = new ExpNodeAudioInputPort('detune', 'detune', () => this, filter.detune)
		const qPort = new ExpNodeAudioInputPort('q', 'q', () => this, filter.Q)
		const gainPort = new ExpNodeAudioInputPort('gain', 'gain', () => this, filter.gain)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain)

		super(id, audioContext, preMasterLimiter, {
			ports: [
				inputPort,
				frequencyPort,
				detunePort,
				qPort,
				gainPort,
				outputPort,
			],
			audioParams: new Map<Id, ExpAudioParam>([
				buildAudioParamDesc('frequency', filter.frequency, 20000, 0, 20000, 3, filterValueToString),
				buildAudioParamDesc('detune', filter.detune, 0, -100, 100, 1, filterValueToString),
				buildAudioParamDesc('q', filter.Q, 1, 0.1, 18),
				buildAudioParamDesc('gain', filter.gain, 0, -1, 1, 1, percentageValueString),
			]),
		})

		// Make sure to add these to the dispose method!
		this._filter = filter
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Filter'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._filter.disconnect()
		this._dryWetChain.dispose()
	}
}

class DryWetChain {
	public readonly inputGain: GainNode
	public readonly dryGain: GainNode
	public readonly wetGain: GainNode
	public readonly outputGain: GainNode

	public constructor(
		audioContext: AudioContext,
		wetInternalNode: AudioNode,
	) {
		this.inputGain = audioContext.createGain()
		this.dryGain = audioContext.createGain()
		this.wetGain = audioContext.createGain()
		this.outputGain = audioContext.createGain()

		this.inputGain
			.connect(this.dryGain)
			.connect(this.outputGain)
		this.inputGain
			.connect(this.wetGain)
			.connect(wetInternalNode)
			.connect(this.outputGain)

		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public wetOnly() {
		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public dryOnly() {
		this.dryGain.gain.value = 1
		this.wetGain.gain.value = 0
	}

	public dispose() {
		this.inputGain.disconnect()
		this.dryGain.disconnect()
		this.wetGain.disconnect()
		this.outputGain.disconnect()
	}
}

export class ExpGainNode extends CorgiNode {
	private readonly _gain: GainNode
	private readonly _dryWetChain: DryWetChain
	private readonly _gainParamWaveShaper: WaveShaperNode
	private readonly _gainConstantSource: ConstantSourceNode

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const gain = audioContext.createGain()
		gain.gain.value = 0
		const gainParamWaveShaper = audioContext.createWaveShaper()
		const gainConstantSource = audioContext.createConstantSource()

		gainParamWaveShaper.curve = new Float32Array([0, 0, 1])

		gainConstantSource.connect(gainParamWaveShaper).connect(gain.gain)
		gainConstantSource.start()

		const dryWetChain = new DryWetChain(audioContext, gain)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const gainPort = new ExpNodeAudioInputPort('gain', 'gain', () => this, gainParamWaveShaper)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain)

		super(id, audioContext, preMasterLimiter, {
			ports: [inputPort, gainPort, outputPort],
			audioParams: new Map<Id, ExpAudioParam>([
				buildAudioParamDesc('gain', gainConstantSource.offset, 1, 0, 1, 1, gainDecibelValueToString),
				// buildAudioParamDesc('gain', gain.gain, 1, 0, 10, 3.33, gainDecibelValueToString),
			]),
		})

		// Make sure to add these to the dispose method!
		this._gain = gain
		this._dryWetChain = dryWetChain
		this._gainParamWaveShaper = gainParamWaveShaper
		this._gainConstantSource = gainConstantSource
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Gain'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._gain.disconnect()
		this._dryWetChain.dispose()
		this._gainParamWaveShaper.disconnect()
		this._gainConstantSource.stop()
		this._gainConstantSource.disconnect()
	}
}

export class ExpPanNode extends CorgiNode {
	private readonly _pan: StereoPannerNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const pan = audioContext.createStereoPanner()

		const dryWetChain = new DryWetChain(audioContext, pan)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const panPort = new ExpNodeAudioInputPort('pan', 'pan', () => this, pan.pan)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain)

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('pan', pan.pan, 0, -1, 1, 1, panValueToString),
		])

		super(id, audioContext, preMasterLimiter, {
			ports: [inputPort, panPort, outputPort],
			audioParams,
		})

		// Make sure to add these to the dispose method!
		this._pan = pan
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.purple
	}

	public getName() {return 'Pan'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._pan.disconnect()
		this._dryWetChain.dispose()
	}
}

const longTime = 999999999
const minDistance = 0.00001

export class EnvelopeNode extends CorgiNode {
	private readonly _constantSource: ConstantSourceNode
	private readonly _outputGain: GainNode
	private readonly _outputPort: ExpNodeAudioOutputPort
	private readonly _gateInputPort: ExpGateInputPort
	// private _intervalId: NodeJS.Timeout
	private _lastGateTime: number
	private _lastGate?: boolean

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const constantSource = audioContext.createConstantSource()
		const outputGain = audioContext.createGain()

		constantSource.offset.value = 0
		constantSource.connect(outputGain)
		constantSource.start()
		constantSource.offset.linearRampToValueAtTime(0, longTime)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, outputGain)

		const gateInputPort = new ExpGateInputPort('input', 'input', () => this, (gate, time) => this.receiveGateSignal.bind(this)(gate, time))

		super(id, audioContext, preMasterLimiter, {
			ports: [outputPort, gateInputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
				// TODO Store reference in private class field
				// buildCustomNumberParamDesc('attack', 0.0005, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('hold', 0, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('decay', 1, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('sustain', 1, 0, 1, 1, gainDecibelValueToString),
				// buildCustomNumberParamDesc('release', 0.015, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('attack', 0.25, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('hold', 0, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('decay', 0, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('sustain', 1, 0, 1, 1, gainDecibelValueToString),
				buildCustomNumberParamDesc('release', 32, 0, 32, 3, adsrValueToString),
			]),
		})

		this._lastGateTime = -1

		this._outputPort = outputPort
		this._gateInputPort = gateInputPort

		// Make sure to add these to the dispose method!
		this._constantSource = constantSource
		this._outputGain = outputGain

		// this._intervalId = setInterval(() => {
		// 	this.receiveGateSignal(true, this.audioContext.currentTime + 0.5)
		// 	this.receiveGateSignal(false, this.audioContext.currentTime + 1.5)
		// }, 1000)
	}

	public getColor(): string {
		return CssColor.blue
	}

	public getName() {return 'Envelope'}

	public receiveGateSignal(gate: boolean, startTime: number) {
		if (startTime < this._lastGateTime) {
			logger.error('receiveGateSignal startTime < this._lastGateTime:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		}
		if (gate === this._lastGate) {
			logger.error('receiveGateSignal gate === this._lastGate:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		}
		this._lastGateTime = startTime
		this._lastGate = gate
		// logger.log({startTime, currentTime: this._audioContext.currentTime/*, diff: startTime - this._audioContext.currentTime */})
		if (startTime < this._audioContext.currentTime) {
			logger.warn('[receiveGateSignal] startTime < this._audioContext.currentTime:', {startTime, currentTime: this._audioContext.currentTime})
		}
		const offset = this._constantSource.offset
		if (gate) {
			const attackEnd = startTime + this._attackSeconds + minDistance
			const holdEnd = attackEnd + this._holdSeconds + minDistance
			const decayEnd = holdEnd + this._decaySeconds + minDistance
			const farOut = decayEnd + longTime + minDistance
			const actualSustain = Math.max(0.0001, this._sustain)
			offset.cancelAndHoldAtTime(startTime)
			offset.linearRampToValueAtTime(1, attackEnd)
			offset.linearRampToValueAtTime(1, holdEnd)
			offset.exponentialRampToValueAtTime(actualSustain, decayEnd)
			offset.linearRampToValueAtTime(actualSustain, farOut)
		} else {
			const releaseEnd = startTime + this._releaseSeconds + minDistance
			const farOut = releaseEnd + longTime + minDistance
			offset.cancelAndHoldAtTime(startTime)
			offset.exponentialRampToValueAtTime(0.0001, releaseEnd)
			offset.linearRampToValueAtTime(0.0001, farOut)
		}
		// farOut is to provide an event to be canceled so an anchor point can
		// be created whenever cancelAndHoldAtTime is called.
	}

	private get _attackSeconds() {return this._customNumberParams.get('attack')!.value}
	private get _holdSeconds() {return this._customNumberParams.get('hold')!.value}
	private get _decaySeconds() {return this._customNumberParams.get('decay')!.value}
	private get _sustain() {return this._customNumberParams.get('sustain')!.value}
	private get _releaseSeconds() {return this._customNumberParams.get('release')!.value}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._outputGain.gain.value = 1
	}

	protected _disable() {
		this._outputGain.gain.value = 0
	}

	protected _dispose() {
		this._constantSource.stop()
		this._constantSource.disconnect()
		this._outputGain.disconnect()
		// clearInterval(this._intervalId)
	}
}

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

// Is there a way to use class decorators to create this map at runtime?
export const typeClassMap: {readonly [key in ExpNodeType]: new (id: Id, context: AudioContext, preMasterLimiter: GainNode) => CorgiNode} = {
	oscillator: OscillatorExpNode,
	dummy: DummyNode,
	filter: FilterNode,
	audioOutput: AudioOutputExpNode,
	gain: ExpGainNode,
	pan: ExpPanNode,
	envelope: EnvelopeNode,
	sequencer: SequencerNode,
}
