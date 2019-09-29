import React, {ReactElement} from 'react'
import {ExpNodeType} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import './ExpNodes.less'
import {
	ExpAudioParam, ExpNodeAudioPort, AudioParamChange,
	ExpNodeAudioInputPort,
	ExpNodeAudioOutputPort,
	ExpNodeConnection,
	buildAudioParamDesc,
} from './ExpTypes'
import {CorgiNode, makePorts} from './CorgiNode'
import {percentageValueString, filterValueToString} from '../client-constants';

export class OscillatorExpNode extends CorgiNode {
	private readonly _oscillator: OscillatorNode
	private readonly _outputGain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const oscillator = audioContext.createOscillator()
		oscillator.frequency.value = 110
		oscillator.type = 'triangle'
		oscillator.start()
		const outputGain = audioContext.createGain()
		oscillator.connect(outputGain)

		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'frequency', oscillator.frequency),
			new ExpNodeAudioInputPort(1, 'detune', oscillator.detune),
		])

		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', outputGain),
		])

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('frequency', oscillator.frequency, 440, 0, 20000, 3, filterValueToString),
			buildAudioParamDesc('detune', oscillator.detune, 0, -100, 100, 1, filterValueToString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		this._oscillator = oscillator
		this._outputGain = outputGain
	}

	public getName() {return 'Oscillator'}

	public onParamChange(paramChange: AudioParamChange) {
		switch (paramChange.paramId) {
			case 'wave': return isOscillatorType(paramChange.newValue) && this._changeOscillatorType(paramChange.newValue)
			default: return logger.warn('unexpected param id: ', {paramChange})
		}
		// Render view
		// Change value on web audio oscillator
	}

	private _changeOscillatorType(newValue: OscillatorType) {
		this._oscillator.type = newValue
	}

	// eslint-disable-next-line no-empty-function
	public onNewAudioOutConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {

	}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._outputGain.gain.value = 1
	}

	protected _disable() {
		this._outputGain.gain.value = 0
	}

	public dispose() {
		this._oscillator.stop()
		this._oscillator.disconnect()
	}
}

export class AudioOutputExpNode extends CorgiNode {
	private readonly _inputGain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const inputGain = audioContext.createGain()
	
		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', inputGain),
		])

		super(id, audioContext, preMasterLimiter,inPorts)

		inputGain.connect(audioContext.destination)
		// inputGain.connect(this.preMasterLimiter)
		this._inputGain = inputGain
	}

	public getName() {return 'Audio Output'}

	public onParamChange(paramChange: AudioParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._inputGain.gain.value = 1
	}

	protected _disable() {
		this._inputGain.gain.value = 0
	}

	public dispose() {
		logger.log('dispose AudioOutputExpNode')
	}
}

export class DummyNode extends CorgiNode {
	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		super(id, audioContext, preMasterLimiter, makePorts([]))
	}

	public getName() {return 'Dummy'}

	public onParamChange(paramChange: AudioParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
	}

	protected _disable() {
	}

	public dispose() {
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

		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', dryWetChain.inputGain),
			new ExpNodeAudioInputPort(1, 'frequency', filter.frequency),
			new ExpNodeAudioInputPort(2, 'detune', filter.detune),
			new ExpNodeAudioInputPort(3, 'q', filter.Q),
			new ExpNodeAudioInputPort(4, 'gain', filter.gain),
		])
		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', dryWetChain.outputGain),
		])

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('frequency', filter.frequency, 20000, 0, 20000, 3, filterValueToString),
			buildAudioParamDesc('detune', filter.detune, 0, -100, 100, 1, filterValueToString),
			buildAudioParamDesc('q', filter.Q, 1, 0.1, 18),
			buildAudioParamDesc('gain', filter.gain, 0, -1, 1, 1, percentageValueString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		this._filter = filter
		this._dryWetChain = dryWetChain
	}

	public getName() {return 'Filter'}

	public onParamChange(paramChange: AudioParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	public dispose() {
		this._filter.disconnect()
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
}

export class ExpGainNode extends CorgiNode {
	private readonly _gain: GainNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const gain = audioContext.createGain()

		const dryWetChain = new DryWetChain(audioContext, gain)

		const inPorts = makePorts([
			new ExpNodeAudioInputPort(0, 'input', dryWetChain.inputGain),
			new ExpNodeAudioInputPort(1, 'gain', gain.gain),
		])
		const outPorts = makePorts([
			new ExpNodeAudioOutputPort(0, 'output', dryWetChain.outputGain),
		])

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('gain', gain.gain, 1, 0, 2, 1, percentageValueString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		this._gain = gain
		this._dryWetChain = dryWetChain
	}

	public getName() {return 'Gain'}

	public onParamChange(paramChange: AudioParamChange) {

		// Render view

		// Change value on web audio oscillator
	}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	public dispose() {
		this._gain.disconnect()
	}
}

// Is there a way to use class decorators to create this map at runtime?
export const typeClassMap: {readonly [key in ExpNodeType]: new (id: Id, context: AudioContext, preMasterLimiter: GainNode) => CorgiNode} = {
	oscillator: OscillatorExpNode,
	dummy: DummyNode,
	filter: FilterNode,
	audioOutput: AudioOutputExpNode,
	gain: ExpGainNode,
}

type ParamTypeStrings = 'number' | 'string' | 'boolean'

// function ifTypeThenDo(type: 'number' ) {

// }

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
