/* eslint-disable no-empty-function */
import React, {useContext} from 'react'
import {List} from 'immutable'
import {ParamInputCentering, SignalRange} from '@corgifm/common/common-types'
import {clamp} from '@corgifm/common/common-utils'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection,
	ExpNodeConnections, ExpNodeConnection,
} from './ExpConnections'
import {ExpAudioParam} from './ExpParams'
import {CorgiNumberChangedEvent, CorgiEnumChangedEvent, CorgiObjectChangedEvent} from './CorgiEvents'
import {CorgiAnalyserSPNode} from './CorgiAnalyserSPN'

export type ExpPortCallback = (port: ExpPort) => void

export interface ExpPortReact extends Pick<ExpPort, 'id' | 'type' | 'onPositionChanged' | 'onConnectionCountChanged'> {}

export abstract class ExpPort {
	protected readonly _connections: ExpNodeConnections = new Map<Id, ExpNodeConnection>()
	private _position: Point = {x: 0, y: 0}
	public get position() {return this._position}
	public readonly onPositionChanged: CorgiObjectChangedEvent<Point>
	public readonly onConnectionCountChanged: CorgiNumberChangedEvent

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		public readonly side: ExpPortSide,
		public readonly type: ExpPortType,
	) {
		this.onPositionChanged = new CorgiObjectChangedEvent(this.position)
		this.onConnectionCountChanged = new CorgiNumberChangedEvent(this.connectionCount)
	}

	public get connectionCount() {return this._connections.size}

	public setPosition(newPosition: Point) {
		this._position = newPosition
		this.onPositionChanged.invokeNextFrame(this.position)
	}
}

export type ExpPorts = Map<Id, ExpPort>

export abstract class ExpNodeAudioPort extends ExpPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, node, side, 'audio')
	}

	public connect = (connection: ExpNodeAudioConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	public disconnect = (connection: ExpNodeAudioConnection, target: AudioNode) => {
		this._disconnect(connection, target)
		this._connections.delete(connection.id)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	protected abstract _connect(connection: ExpNodeAudioConnection): void
	protected abstract _disconnect(connection: ExpNodeAudioConnection, target: AudioNode): void
}

export interface ExpNodeAudioInputPortArgs {
	readonly id: Id
	readonly name: string
	readonly destination: AudioNode | AudioParam
}

const curves = {
	bipolar: {
		center: null,
		offset: new Float32Array([0, 1]),
	},
	unipolar: {
		center: new Float32Array([-3, 1]),
		offset: null,
	},
} as const

export interface ParamInputChainReact extends Pick<ParamInputChain, 'id' | 'centering' | 'onGainChange' | 'onCenteringChange'> {}

// TODO Maybe, use current knob value to determine starting gain value, like serum
class ParamInputChain {
	public get centering() {return this._centering}
	public get gain() {return this._gain.gain.value}
	public get clampedGain() {return this._clampedGainValue}
	public readonly onGainChange: CorgiNumberChangedEvent
	public readonly onCenteringChange: CorgiEnumChangedEvent<ParamInputCentering>
	private readonly _waveShaper: WaveShaperNode
	private readonly _gain: GainNode
	private _centering: ParamInputCentering
	private _clampedGainValue = 1

	public constructor(
		public readonly id: Id,
		audioContext: AudioContext,
		private readonly _destination: AudioParam | AudioNode,
		defaultCentering: ParamInputCentering,
		private readonly _destinationRange: SignalRange,
		private readonly _updateLiveRange: () => void,
	) {
		this._waveShaper = audioContext.createWaveShaper()
		this._gain = audioContext.createGain()

		this._waveShaper.connect(this._gain).connect(this._destination as AudioNode)

		this._centering = defaultCentering
		this.onCenteringChange = new CorgiEnumChangedEvent(this._centering)
		this._setCentering(this._centering)

		this.onGainChange = new CorgiNumberChangedEvent(1)
		this.setGain(1)
	}

	public setCentering(newCentering: ParamInputCentering) {
		if (newCentering === this._centering) return
		this._setCentering(newCentering)
	}

	private _setCentering(newCentering: ParamInputCentering) {
		this._centering = newCentering
		this._waveShaper.curve = curves['bipolar'][this._centering]
		this.onCenteringChange.invokeImmediately(this._centering)
		this._updateModdedGain()
		this._updateLiveRange()
	}

	public setGain(gain: number) {
		this._clampedGainValue = clamp(gain, -1, 1)
		this._updateModdedGain()
		this.onGainChange.invokeImmediately(this._clampedGainValue)
		this._updateLiveRange()
	}

	private _updateModdedGain() {
		const modded = this._clampedGainValue * extraGain[this.centering][this._destinationRange]
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const frounded = Math.fround(modded)
		if (frounded === this._gain.gain.value) return
		this._gain.gain.value = frounded
	}

	public getInput(): AudioNode {
		return this._waveShaper
	}

	public dispose() {
		this._waveShaper.disconnect()
		this._gain.disconnect()
	}
}

const extraGain = {
	center: {
		unipolar: 0.5,
		bipolar: 1,
	},
	offset: {
		unipolar: 1,
		bipolar: 2,
	},
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		public readonly destination: AudioNode | AudioParam,
	) {
		super(id, name, node, 'in')
	}

	public prepareDestinationForConnection(connectionId: Id): AudioNode | AudioParam {
		return this.destination
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.node.detectAudioFeedbackLoop(i, nodeIds)
	}
}

interface LiveRange {
	readonly min: number
	readonly max: number
}

export const AudioParamInputPortContext = React.createContext<null | ExpNodeAudioParamInputPortReact>(null)

export function useAudioParamInputPortContext() {
	const context = useContext(AudioParamInputPortContext)

	if (!context) throw new Error(`missing audio param context, maybe there's no provider`)

	return context
}

export interface ExpNodeAudioParamInputPortReact extends Pick<ExpNodeAudioParamInputPort, 'onLiveRangeChanged' | 'onChainsChanged'> {}

export class ExpNodeAudioParamInputPort extends ExpNodeAudioInputPort {
	private readonly _inputChains = new Map<Id, ParamInputChain>()
	private readonly _waveShaperClamp: WaveShaperNode
	private readonly _gainDenormalizer: GainNode
	private readonly _knobConstantSource: ConstantSourceNode
	private readonly _analyser: CorgiAnalyserSPNode
	public readonly destination: AudioParam
	public readonly onLiveRangeChanged: CorgiObjectChangedEvent<LiveRange>
	public readonly onChainsChanged: CorgiObjectChangedEvent<Map<Id, ParamInputChain>>
	private _knobValue: number

	public constructor(
		public readonly expAudioParam: ExpAudioParam,
		public readonly node: CorgiNode,
		public readonly audioContext: AudioContext,
		public readonly defaultCentering: ParamInputCentering,
	) {
		super(expAudioParam.id, expAudioParam.id as string, node, expAudioParam.audioParam)

		this.destination = expAudioParam.audioParam

		// All AudioParam values should be 0, because it will only be
		// controlled from modulation sources, including the knob.
		this.destination.setValueAtTime(0, 0)

		this._waveShaperClamp = audioContext.createWaveShaper()
		this._gainDenormalizer = audioContext.createGain()
		this._knobConstantSource = audioContext.createConstantSource()
		this._analyser = new CorgiAnalyserSPNode(audioContext, this._onAnalyserUpdate)

		this._requestWorkletUpdate()

		this._knobConstantSource.offset.setValueAtTime(expAudioParam.defaultNormalizedValue, 0)
		this._knobValue = expAudioParam.defaultNormalizedValue
		this._knobConstantSource.start()

		this._gainDenormalizer.gain.value = this.expAudioParam.maxValue

		this._waveShaperClamp.curve = this.expAudioParam.curveFunctions.waveShaperCurve

		this._gainDenormalizer.connect(this._analyser.input)

		this._knobConstantSource
			.connect(this._waveShaperClamp)
			.connect(this._gainDenormalizer)
			.connect(this.destination)

		this.onLiveRangeChanged = new CorgiObjectChangedEvent(this._createLiveRange())
		this.onChainsChanged = new CorgiObjectChangedEvent(this._inputChains)
	}

	private readonly _onAnalyserUpdate = (newValue: number) => {
		const unCurved = this.expAudioParam.curveFunctions.unCurve(newValue / this.expAudioParam.maxValue)
		this.expAudioParam.onModdedLiveValueChange.invokeNextFrame(unCurved, this._requestWorkletUpdate)
	}

	private _createLiveRange(): LiveRange {
		let min = 0
		let max = 0

		this._inputChains.forEach(chain => {
			switch (chain.centering) {
				case 'center':
					const g2 = (Math.abs(chain.clampedGain) / 2)
					min -= g2
					max += g2
					break
				case 'offset':
					min += clamp(chain.clampedGain, -1, 0)
					max += clamp(chain.clampedGain, 0, 1)
					break
			}
		})

		const knobValue = this.expAudioParam.paramSignalRange === 'bipolar'
			? this._knobValue / 2
			: this._knobValue

		const allowedMin = this.expAudioParam.paramSignalRange === 'bipolar'
			? clamp(-knobValue - 0.5, -1, 0)
			: clamp(-knobValue, -1, 0)

		const allowedMax = this.expAudioParam.paramSignalRange === 'bipolar'
			? clamp(-knobValue + 0.5, 0, 1)
			: clamp(-knobValue + 1, 0, 1)

		min = Math.max(min, allowedMin)
		max = Math.min(max, allowedMax)

		return {min, max}
	}

	private readonly _updateLiveRange = () => {
		this.onLiveRangeChanged.invokeImmediately(this._createLiveRange())
	}

	private readonly _requestWorkletUpdate = () => {
		this._analyser.requestUpdate()
	}

	public getChains(): readonly ParamInputChainReact[] {
		return [...this._inputChains].map(x => x[1])
	}

	public setKnobValue(value: number) {
		this._knobConstantSource.offset.setTargetAtTime(value, 0, 0.005)
		this._knobValue = value
		this._updateLiveRange()
	}

	public setChainGain(connectionId: Id, value: number) {
		const chain = this._inputChains.get(connectionId)

		if (!chain) return logger.error('[setChainGain] 404 chain not found!:', {connectionId, value})

		chain.setGain(value)
	}

	public setChainCentering(connectionId: Id, centering: ParamInputCentering) {
		const chain = this._inputChains.get(connectionId)

		if (!chain) return logger.error('[setChainCentering] 404 chain not found!:', {connectionId, centering})

		chain.setCentering(centering)
	}

	public prepareDestinationForConnection(connectionId: Id): AudioNode {
		const existingChain = this._inputChains.get(connectionId)

		if (existingChain) return existingChain.getInput()

		const newChain = new ParamInputChain(
			connectionId,
			this.audioContext,
			this._waveShaperClamp,
			this.defaultCentering,
			this.expAudioParam.paramSignalRange,
			this._updateLiveRange,
		)

		this._inputChains.set(connectionId, newChain)

		// Next frame because connection hasn't been added to connections collection yet
		this.onChainsChanged.invokeNextFrame(this._inputChains)

		this._updateLiveRange()

		return newChain.getInput()
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		const existingChain = this._inputChains.get(connection.id)

		if (!existingChain) return

		existingChain.dispose()

		this._inputChains.delete(connection.id)

		this.onChainsChanged.invokeImmediately(this._inputChains)
	}

	public dispose() {
		this._inputChains.forEach(x => x.dispose())
		this._waveShaperClamp.disconnect()
		this._gainDenormalizer.disconnect()
		this._knobConstantSource.stop()
		this._knobConstantSource.disconnect()
		this._analyser.dispose()
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
		public readonly node: CorgiNode,
		public readonly source: AudioNode,
	) {
		super(id, name, node, 'out')
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
	}

	protected _disconnect = (connection: ExpNodeAudioConnection, target: AudioNode) => {
		try {
			this.source.disconnect(target)
		} catch (error) {
			// logger.warn('[_disconnect] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this.node.id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this.node.id))
		})
	}
}

export type ExpPortSide = 'in' | 'out'

export type ExpPortType = 'audio' | 'midi' | 'dummy'

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
