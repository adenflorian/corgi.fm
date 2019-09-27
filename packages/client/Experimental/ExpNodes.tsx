import React, {ReactElement} from 'react'
import {ExpNodeType} from '@corgifm/common/redux'
import {logger} from '../client-logger'

export abstract class CorgiNode {
	public constructor(
		public readonly id: Id,
		public readonly audioContext: AudioContext,
		protected readonly _audioInputPorts: ExpNodeAudioInputPorts = makePorts<ExpNodeAudioInputPort>([]),
		protected readonly _audioOutPorts: ExpNodeAudioOutputPorts = makePorts<ExpNodeAudioOutputPort>([]),
	) { }

	public abstract onParamChange(paramChange: ParamChange): void
	public abstract render(): ReactElement<any>
	public abstract dispose(): void

	public onNewAudioOutConnection(port: ExpNodePort, connection: ExpNodeConnection) {
		logger.log('onNewAudioOutConnection default')
	}

	public onNewAudioInConnection(port: ExpNodePort, connection: ExpNodeConnection) {
		logger.log('onNewAudioInConnection default')
	}

	public getAudioInputPort(id: number): ExpNodeAudioInputPort | undefined {
		return this._audioInputPorts.get(id)
	}

	public getAudioOutputPort(id: number): ExpNodeAudioOutputPort | undefined {
		return this._audioOutPorts.get(id)
	}
}

export class OscillatorExpNode extends CorgiNode {
	private readonly _oscillator: OscillatorNode

	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		const oscillator = audioContext.createOscillator()
		oscillator.frequency.value = 110
		oscillator.type = 'triangle'
		oscillator.start()

		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'frequency', oscillator.frequency),
		])

		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', oscillator),
		])

		super(id, audioContext, inPorts, outPorts)

		this._oscillator = oscillator
	}

	public onParamChange(paramChange: ParamChange) {
		// Render view
		// Change value on web audio oscillator
	}

	public onNewAudioOutConnection(port: ExpNodePort, connection: ExpNodeConnection) {
		// if (port.inputOrOutput === 'out') {
		// 	// connection.getTarget().
		// 	this._oscillator.connect()
		// }
		// switch (port.name) {
		// 	case 'output':
		// }
	}

	public render() {
		return (
			<div className="oscillator">
				<h2>osc</h2>
				<p>{this.id}</p>
			</div>
		)
	}

	public dispose() {
		this._oscillator.stop()
		this._oscillator.disconnect()
	}
}

export class AudioOutputExpNode extends CorgiNode {
	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', audioContext.destination),
		])

		super(id, audioContext, inPorts)
	}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return (
			<div className="audioOut">
				<h2>audio out</h2>
			</div>
		)
	}

	public dispose() {
		logger.log('dispose AudioOutputExpNode')
	}
}

export class DummyNode extends CorgiNode {
	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		super(id, audioContext, makePorts([]))
	}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return (
			<div className="dummy">
				<h2>dummy dumdum</h2>
				<p>{this.id}</p>
			</div>
		)
	}

	public dispose() {
		logger.log('dispose DummyNode')
	}
}

export class FilterNode extends CorgiNode {
	private readonly _filter: BiquadFilterNode

	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		const filter = audioContext.createBiquadFilter()
		filter.frequency.value = 150
		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', filter),
			new ExpNodeAudioInputPort(1, 'frequency', filter.frequency),
		])
		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', filter),
		])
		super(id, audioContext, inPorts, outPorts)

		this._filter = filter
	}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return (
			<div className="filter">
				<h2>filter</h2>
				<p>{this.id}</p>
			</div>
		)
	}

	public dispose() {
		this._filter.disconnect()
	}
}

export class ExpGainNode extends CorgiNode {
	private readonly _gain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		const gain = audioContext.createGain()
		gain.gain.value = 500
		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', gain),
			new ExpNodeAudioInputPort(1, 'gain', gain.gain),
		])
		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', gain),
		])
		super(id, audioContext, inPorts, outPorts)

		this._gain = gain
	}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return (
			<div className="filter">
				<h2>filter</h2>
				<p>{this.id}</p>
			</div>
		)
	}

	public dispose() {
		this._gain.disconnect()
	}
}

// Is there a way to use class decorators to create this map at runtime?
export const typeClassMap: {[key in ExpNodeType]: new (id: Id, context: AudioContext) => CorgiNode} = {
	oscillator: OscillatorExpNode,
	dummy: DummyNode,
	filter: FilterNode,
	audioOutput: AudioOutputExpNode,
	gain: ExpGainNode,
}

export interface ParamChange {
	paramName: string
	newValue: number | string | boolean
	timestamp: number
	targetNodeId: Id
}

// Different connection types could have different functions for sending data across
export class ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpNodePort,
		private _target: ExpNodePort,
	) {}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public connectSource(source: ExpNodePort) {
		this._source = source
	}

	public connectTarget(target: ExpNodePort) {
		this._target = target
	}
}

export type ExpNodeConnections = Map<Id, ExpNodeConnection>

export abstract class ExpNodePort {
	protected readonly _connections: ExpNodeConnections = new Map<Id, ExpNodeConnection>()

	public constructor(
		public readonly id: number,
		public readonly name: string,
	) {}

	public connect(connection: ExpNodeConnection) {
		this._connections.set(connection.id, connection)
	}
}

export class ExpNodeAudioInputPort extends ExpNodePort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name)
	}
}

export class ExpNodeAudioOutputPort extends ExpNodePort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly source: AudioNode
	) {
		super(id, name)
	}
}

export type ExpNodePortType = 'audio' | 'midi'

export type ExpNodePortIO = 'in' | 'out'

export type ExpNodePorts = Map<number, ExpNodePort>
export type ExpNodeAudioInputPorts = Map<number, ExpNodeAudioInputPort>
export type ExpNodeAudioOutputPorts = Map<number, ExpNodeAudioOutputPort>

export function makePorts<T extends ExpNodePort>(ports: readonly T[]): Map<number, T> {
	const map = new Map<number, T>()
	ports.forEach(x => map.set(x.id, x))
	return map
}
