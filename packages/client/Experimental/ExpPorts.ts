/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection,
	ExpNodeConnections, ExpNodeConnection,
} from './ExpConnections'
// import {createCustomAnalyserWorkletNode} from './ExpNodes'

export type ExpPortCallback = (port: ExpPort) => void

export interface ExpPortReact extends ExpPort {}

export abstract class ExpPort {
	public readonly subscribers = new Map<ExpPortCallback, ExpPortCallback>()
	protected readonly _connections: ExpNodeConnections = new Map<Id, ExpNodeConnection>()
	private _position: Point = {x: 0, y: 0}

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly side: ExpPortSide,
		public readonly type: ExpPortType,
	) {}

	public get position() {return this._position}

	public get connectionCount() {return this._connections.size}

	public setPosition(newPosition: Point) {
		this._position = newPosition
		this.onUpdated()
	}

	public onUpdated() {
		logger.log('ExpPort onUpdated:', this)
		this.subscribers.forEach(x => x(this))
		this._connections.forEach(x => x.onPortUpdated(this))
	}
}

export type ExpPorts = Map<Id, ExpPort>

export abstract class ExpNodeAudioPort extends ExpPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, getNode, side, 'audio')
	}

	public connect = (connection: ExpNodeAudioConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onUpdated()
	}

	public disconnect = (connection: ExpNodeAudioConnection, target: AudioNode) => {
		this._disconnect(connection, target)
		this._connections.delete(connection.id)
		this.onUpdated()
	}

	protected abstract _connect(connection: ExpNodeAudioConnection): void
	protected abstract _disconnect(connection: ExpNodeAudioConnection, target: AudioNode): void
}

export interface ExpNodeAudioInputPortArgs {
	readonly id: Id
	readonly name: string
	readonly destination: AudioNode | AudioParam
}

type SignalRange = 'unipolar' | 'bipolar'

type ParamInputCentering = 'center' | 'offset'

const curves = {
	bipolar: {
		center: null,
		offset: new Float32Array([0, 1]),
	},
	unipolar: {
		center: new Float32Array([-2, 1]),
		offset: null,
	},
} as const

// TODO Maybe, use current knob value to determine starting gain value, like serum
class ParamInputChain {
	private readonly _waveShaper: WaveShaperNode
	private readonly _gain: GainNode
	private _centering: ParamInputCentering

	public constructor(
		audioContext: AudioContext,
		private readonly _destination: AudioParam | AudioNode,
		private readonly _inputRange: SignalRange,
		private readonly _defaultCentering: ParamInputCentering,
	) {
		this._centering = this._defaultCentering

		this._waveShaper = audioContext.createWaveShaper()
		this._gain = audioContext.createGain()

		this._gain.gain.value = 1
		this.updateWaveShaperCurve()

		this._waveShaper.connect(this._gain).connect(this._destination as AudioNode)
	}

	public setCentering(newCentering: ParamInputCentering) {
		if (newCentering === this._centering) return
		this._centering = newCentering
		this.updateWaveShaperCurve()
	}

	public setGain(gain: number) {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newGain = Math.fround(gain)
		if (newGain === this._gain.gain.value) return
		this._gain.gain.value = gain
	}

	private updateWaveShaperCurve() {
		this._waveShaper.curve = curves[this._inputRange][this._centering]
	}

	public getInput(): AudioNode {
		return this._waveShaper
	}

	public dispose() {
		this._waveShaper.disconnect()
		this._gain.disconnect()
	}
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly destination: AudioNode | AudioParam,
	) {
		super(id, name, getNode, 'in')
	}

	public prepareDestinationForConnection(connectionId: Id, signalRange: SignalRange): AudioNode | AudioParam {
		return this.destination
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.getNode().detectAudioFeedbackLoop(i, nodeIds)
	}
}

const waveShaperClampCurves = {
	bipolar: new Float32Array([-1, 1]),
	unipolar: new Float32Array([0, 0, 1]),
}

export class ExpNodeAudioParamInputPort extends ExpNodeAudioInputPort {
	private readonly _inputChains = new Map<Id, ParamInputChain>()
	private readonly _waveShaperClamp: WaveShaperNode
	private readonly _gainDenormalizer: GainNode
	private readonly _knobConstantSource: ConstantSourceNode
	private readonly _gainNormalizer: GainNode
	// private readonly _analyser: AudioWorkletNode

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly destination: AudioParam,
		public readonly audioContext: AudioContext,
		public readonly defaultCentering: ParamInputCentering,
		public readonly maxValue: number,
		public readonly paramSignalRange: SignalRange,
		public readonly defaultParamValue: number,
	) {
		super(id, name, getNode, destination)

		// All AudioParam values should be 0, because it will only be
		// controlled from modulation sources, including the knob.
		this.destination.value = 0

		this._waveShaperClamp = audioContext.createWaveShaper()
		this._gainDenormalizer = audioContext.createGain()
		this._knobConstantSource = audioContext.createConstantSource()
		this._gainNormalizer = audioContext.createGain()
		// this._analyser = createCustomAnalyserWorkletNode(audioContext)



		// this._analyser.port.onmessage = (event) => {
		// 	// Handling data from the processor.
		// 	// console.log('[OscillatorExpNode] ', event.data);
		// 	this.getNode().setAudioParamAutoValue(this.id, event.data)

		// 	this._analyser.port.postMessage('Hello from osc!');
		// };

		// this._analyser.port.postMessage('Hello from osc!');

		this._knobConstantSource.offset.value = defaultParamValue
		this._knobConstantSource.start()

		this._gainDenormalizer.gain.value = maxValue
		this._gainNormalizer.gain.value = 1 / maxValue

		this._waveShaperClamp.curve = waveShaperClampCurves[paramSignalRange]

		this._knobConstantSource
			.connect(this._gainNormalizer)
			.connect(this._waveShaperClamp)
			.connect(this._gainDenormalizer)
			// .connect(this._analyser)
			.connect(destination)
	}

	public setKnobValue(value: number) {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newValue = Math.fround(value)
		if (newValue === this._knobConstantSource.offset.value) return
		this._knobConstantSource.offset.value = newValue
	}

	public prepareDestinationForConnection(connectionId: Id, signalRange: SignalRange): AudioNode {
		const existingChain = this._inputChains.get(connectionId)

		if (existingChain) return existingChain.getInput()

		const newChain = new ParamInputChain(this.audioContext, this._waveShaperClamp, signalRange, this.defaultCentering)

		this._inputChains.set(connectionId, newChain)

		return newChain.getInput()
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		const existingChain = this._inputChains.get(connection.id)

		if (!existingChain) return

		existingChain.dispose()

		this._inputChains.delete(connection.id)
	}

	public dispose() {
		this._inputChains.forEach(x => x.dispose())
		this._waveShaperClamp.disconnect()
		this._gainDenormalizer.disconnect()
		this._knobConstantSource.stop()
		this._knobConstantSource.disconnect()
		this._gainNormalizer.disconnect()
	}
}

export interface ExpNodeAudioOutputPortArgs {
	readonly id: Id
	readonly name: string
	readonly source: AudioNode
}

export class ExpNodeAudioOutputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly source: AudioNode,
		public readonly signalRange: SignalRange,
	) {
		super(id, name, getNode, 'out')
	}

	public getSource(connectionId: Id) {
		return this.source
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	public changeTarget = (oldTarget: AudioNode, newTarget: AudioNode) => {
		try {
			this.source.disconnect(oldTarget)
		} catch (error) {
			logger.warn('[changeTarget] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
		if (!this.detectFeedbackLoop()) {
			this.source.connect(newTarget)
		}
		this.onUpdated()
	}

	protected _disconnect = (connection: ExpNodeAudioConnection, target: AudioNode) => {
		try {
			this.source.disconnect(target)
		} catch (error) {
			logger.warn('[_disconnect] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this.getNode().id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this.getNode().id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this.getNode().id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this.getNode().id))
		})
	}
}

export type ExpPortSide = 'in' | 'out'

export type ExpPortType = 'audio' | 'gate' | 'dummy'

export type ExpNodeAudioInputPorts = readonly ExpNodeAudioInputPort[]
export type ExpNodeAudioOutputPorts = readonly ExpNodeAudioOutputPort[]

export function isAudioOutputPort(val: unknown): val is ExpNodeAudioOutputPort {
	return val instanceof ExpNodeAudioOutputPort
}

export function isAudioInputPort(val: unknown): val is ExpNodeAudioInputPort {
	return val instanceof ExpNodeAudioInputPort
}

export function isAudioParamInputPort(val: unknown): val is ExpNodeAudioParamInputPort {
	return val instanceof ExpNodeAudioParamInputPort
}
