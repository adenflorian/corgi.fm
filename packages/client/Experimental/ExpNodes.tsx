import React, {ReactElement} from 'react'
import {ExpNodeType} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import './ExpNodes.less'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpAudioParam, ExpNodeAudioPort, ParamChange, ExpNodeAudioInputPorts, ExpNodeAudioInputPort, ExpNodeAudioOutputPorts, ExpNodeAudioOutputPort, ExpNodeConnection} from './ExpTypes'

export abstract class CorgiNode {
	public constructor(
		public readonly id: Id,
		public readonly audioContext: AudioContext,
		protected readonly _audioInputPorts: ExpNodeAudioInputPorts = makePorts<ExpNodeAudioInputPort>([]),
		protected readonly _audioOutPorts: ExpNodeAudioOutputPorts = makePorts<ExpNodeAudioOutputPort>([]),
		private readonly _params: Map<string, ExpAudioParam> = new Map(),
	) {}

	public abstract onParamChange(paramChange: ParamChange): void
	public abstract render(): ReactElement<any>
	public abstract dispose(): void
	public abstract getName(): string

	public onNewAudioOutConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {
		logger.log('onNewAudioOutConnection default')
	}

	public onNewAudioInConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {
		logger.log('onNewAudioInConnection default')
	}

	public getAudioInputPort(id: number): ExpNodeAudioInputPort | undefined {
		return this._audioInputPorts.get(id)
	}

	public getAudioOutputPort(id: number): ExpNodeAudioOutputPort | undefined {
		return this._audioOutPorts.get(id)
	}

	protected getDebugView() {
		return (
			<ExpNodeDebugView
				nodeId={this.id}
				nodeName={this.getName()}
				audioParams={this._params}
				audioInputPorts={this._audioInputPorts}
				audioOutputPorts={this._audioOutPorts}
			/>
		)
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
			new ExpNodeAudioInputPort(1, 'detune', oscillator.detune),
		])

		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', oscillator),
		])

		const audioParams = new Map<string, ExpAudioParam>([
			['frequency', buildAudioParamDesc(oscillator.frequency)],
			['detune', buildAudioParamDesc(oscillator.detune)],
		])

		super(id, audioContext, inPorts, outPorts, audioParams)

		this._oscillator = oscillator
	}

	public getName() {return 'Oscillator'}

	public onParamChange(paramChange: ParamChange) {
		switch (paramChange.paramId) {
			case 'frequency': return isNumber(paramChange.newValue) && this._changeFrequency(paramChange.newValue)
			case 'wave': return isOscillatorType(paramChange.newValue) && this._changeOscillatorType(paramChange.newValue)
			default: return logger.warn('unexpected param id: ', {paramChange})
		}
		// Render view
		// Change value on web audio oscillator
	}

	private _changeFrequency(newValue: number) {
		this._oscillator.frequency.value = newValue
	}

	private _changeOscillatorType(newValue: OscillatorType) {
		this._oscillator.type = newValue
	}

	public onNewAudioOutConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {
	}

	public render() {
		return this.getDebugView()
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

	public getName() {return 'Audio Output'}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
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

	public getName() {return 'Dummy'}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
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

		const audioParams = new Map<string, ExpAudioParam>([
			['frequency', buildAudioParamDesc(filter.frequency)],
			['detune', buildAudioParamDesc(filter.detune)],
			['q', buildAudioParamDesc(filter.Q)],
			['gain', buildAudioParamDesc(filter.gain)],
		])

		super(id, audioContext, inPorts, outPorts, audioParams)

		this._filter = filter
	}

	public getName() {return 'Filter'}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	public dispose() {
		this._filter.disconnect()
	}
}

function buildAudioParamDesc(audioParam: AudioParam) {
	return {
		audioParam,
		min: audioParam.minValue,
		max: audioParam.maxValue,
		default: audioParam.defaultValue,
	}
}

export class ExpGainNode extends CorgiNode {
	private readonly _gain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext,
	) {
		const gain = audioContext.createGain()
		// gain.gain.value = 500
		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', gain),
			new ExpNodeAudioInputPort(1, 'gain', gain.gain),
		])
		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', gain),
		])

		const audioParams = new Map<string, ExpAudioParam>([
			['gain', buildAudioParamDesc(gain.gain)],
		])

		super(id, audioContext, inPorts, outPorts, audioParams)

		this._gain = gain
	}

	public getName() {return 'Gain'}

	public onParamChange(paramChange: ParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	public dispose() {
		this._gain.disconnect()
	}
}

// Is there a way to use class decorators to create this map at runtime?
export const typeClassMap: {readonly [key in ExpNodeType]: new (id: Id, context: AudioContext) => CorgiNode} = {
	oscillator: OscillatorExpNode,
	dummy: DummyNode,
	filter: FilterNode,
	audioOutput: AudioOutputExpNode,
	gain: ExpGainNode,
}

export function makePorts<T extends ExpNodeAudioPort>(ports: readonly T[]): Map<number, T> {
	const map = new Map<number, T>()
	ports.forEach(x => map.set(x.id, x))
	return map
}

type ParamTypeStrings = 'number' | 'string' | 'boolean'

function ifTypeThenDo(type: 'number' ) {

}

function isNumber(val: unknown): val is number {
	return typeof val === 'number'
}

function isFrequency(val: unknown): val is EPTFrequency {
	return typeof val === 'number'
}

function isString(val: unknown): val is string {
	return typeof val === 'string'
}

function isBoolean(val: unknown): val is boolean {
	return typeof val === 'boolean'
}

const oscillatorTypes = Object.freeze([
	'sine', 'square', 'sawtooth', 'triangle', 'custom',
])

type EPTFrequency = number

type ExpParamTypeGuard<T> = (val: unknown) => val is T

export const expParamTypeGuards = {
	Frequency: isFrequency,
	Boolean: isBoolean,
	OscillatorType: isOscillatorType,
} as const

function isOscillatorType(val: unknown): val is OscillatorType {
	if (isString(val)) {
		return oscillatorTypes.includes(val)
	} else {
		return false
	}
}
