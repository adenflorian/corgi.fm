import {ExpNodeType} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../client-logger'
import {
	percentageValueString, filterValueToString,
	panValueToString, adsrValueToString, gainDecibelValueToString,
} from '../client-constants'
import {
	ExpNodeAudioPort, ExpNodeAudioInputPortArgs, ExpNodeAudioOutputPortArgs,
} from './ExpPorts'
import {CorgiNode} from './CorgiNode'
import {
	ExpAudioParam, buildAudioParamDesc, NumberParamChange,
	ExpCustomNumberParam, buildCustomNumberParamDesc,
} from './ExpParams'
import {ExpNodeConnection} from './ExpConnections'
import './ExpNodes.less'

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

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
			{id: 0, name: 'frequency', destination: oscillator.frequency},
			{id: 1, name: 'detune', destination: oscillator.detune},
		]
		const outPorts: readonly ExpNodeAudioOutputPortArgs[] = [
			{id: 0, name: 'output', source: outputGain},
		]

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('frequency', oscillator.frequency, 440, 0, 20000, 3, filterValueToString),
			buildAudioParamDesc('detune', oscillator.detune, 0, -100, 100, 1, filterValueToString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		// Make sure to add these to the dispose method!
		this._oscillator = oscillator
		this._outputGain = outputGain
	}

	public getColor(): string {
		return CssColor.green
	}

	public getName() {return 'Oscillator'}

	public onNumberParamChange(paramChange: NumberParamChange) {
		// switch (paramChange.paramId) {
		// 	case 'wave': return isOscillatorType(paramChange.newValue) && this._changeOscillatorType(paramChange.newValue)
		// 	default: return logger.warn('unexpected param id: ', {paramChange})
		// }
		// Render view
		// Change value on web audio oscillator
	}

	// private _changeOscillatorType(newValue: OscillatorType) {
	// 	this._oscillator.type = newValue
	// }

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

	protected _dispose() {
		this._oscillator.stop()
		this._oscillator.disconnect()
		this._outputGain.disconnect()
	}
}

export class AudioOutputExpNode extends CorgiNode {
	private readonly _inputGain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const inputGain = audioContext.createGain()

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
			{id: 0, name: 'input', destination: inputGain},
		]

		super(id, audioContext, preMasterLimiter,inPorts)

		inputGain.connect(audioContext.destination)
		// inputGain.connect(this.preMasterLimiter)

		// Make sure to add these to the dispose method!
		this._inputGain = inputGain
	}

	public getName() {return 'Audio Output'}

	public onNumberParamChange(paramChange: NumberParamChange) {
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

	public onNumberParamChange(paramChange: NumberParamChange) {
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

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
			{id: 0, name: 'input', destination: dryWetChain.inputGain},
			{id: 1, name: 'frequency', destination: filter.frequency},
			{id: 2, name: 'detune', destination: filter.detune},
			{id: 3, name: 'q', destination: filter.Q},
			{id: 4, name: 'gain', destination: filter.gain},
		]
		const outPorts: readonly ExpNodeAudioOutputPortArgs[] = [
			{id: 0, name: 'output', source: dryWetChain.outputGain},
		]

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('frequency', filter.frequency, 20000, 0, 20000, 3, filterValueToString),
			buildAudioParamDesc('detune', filter.detune, 0, -100, 100, 1, filterValueToString),
			buildAudioParamDesc('q', filter.Q, 1, 0.1, 18),
			buildAudioParamDesc('gain', filter.gain, 0, -1, 1, 1, percentageValueString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		// Make sure to add these to the dispose method!
		this._filter = filter
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Filter'}

	public onNumberParamChange(paramChange: NumberParamChange) {
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

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
			{id: 0, name: 'input', destination: dryWetChain.inputGain},
			{id: 1, name: 'gain', destination: gainParamWaveShaper},
		]
		const outPorts: readonly ExpNodeAudioOutputPortArgs[] = [
			{id: 0, name: 'output', source: dryWetChain.outputGain},
		]

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('gain', gainConstantSource.offset, 1, 0, 1, 1, gainDecibelValueToString),
			// buildAudioParamDesc('gain', gain.gain, 1, 0, 10, 3.33, gainDecibelValueToString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		// Make sure to add these to the dispose method!
		this._gain = gain
		this._dryWetChain = dryWetChain
		this._gainParamWaveShaper = gainParamWaveShaper
		this._gainConstantSource = gainConstantSource
	}

	public getColor(): string {
		return CssColor.yellow
	}

	public getName() {return 'Gain'}

	public onNumberParamChange(paramChange: NumberParamChange) {

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

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
			{id: 0, name: 'input', destination: dryWetChain.inputGain},
			{id: 1, name: 'pan', destination: pan.pan},
		]
		const outPorts: readonly ExpNodeAudioOutputPortArgs[] = [
			{id: 0, name: 'output', source: dryWetChain.outputGain},
		]

		const audioParams = new Map<Id, ExpAudioParam>([
			buildAudioParamDesc('pan', pan.pan, 0, -1, 1, 1, panValueToString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams)

		// Make sure to add these to the dispose method!
		this._pan = pan
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.purple
	}

	public getName() {return 'Pan'}

	public onNumberParamChange(paramChange: NumberParamChange) {

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

	protected _dispose() {
		this._pan.disconnect()
		this._dryWetChain.dispose()
	}
}

const longTime = 999999999

export class EnvelopeNode extends CorgiNode {
	private readonly _constantSource: ConstantSourceNode
	private readonly _outputGain: GainNode
	private _intervalId: NodeJS.Timeout

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const constantSource = audioContext.createConstantSource()
		const outputGain = audioContext.createGain()

		constantSource.offset.value = 0
		constantSource.connect(outputGain)
		constantSource.start()
		constantSource.offset.linearRampToValueAtTime(0, longTime)

		const inPorts: readonly ExpNodeAudioInputPortArgs[] = [
		]
		const outPorts: readonly ExpNodeAudioOutputPortArgs[] = [
			{id: 0, name: 'output', source: outputGain},
		]

		const audioParams = new Map<Id, ExpAudioParam>([
		])

		const customNumberParams = new Map<Id, ExpCustomNumberParam>([
			// buildCustomNumberParamDesc('attack', 0.0005, 0.0005, 0, 32, 3, adsrValueToString),
			// buildCustomNumberParamDesc('hold', 0, 0, 0, 32, 3, adsrValueToString),
			// buildCustomNumberParamDesc('decay', 1, 1, 0, 32, 3, adsrValueToString),
			// buildCustomNumberParamDesc('sustain', 1, 1, 0, 1, 1, gainDecibelValueToString),
			// buildCustomNumberParamDesc('release', 0.015, 0.015, 0, 32, 3, adsrValueToString),
			buildCustomNumberParamDesc('attack', 0.5, 0.5, 0, 32, 3, adsrValueToString),
			buildCustomNumberParamDesc('hold', 0, 0, 0, 32, 3, adsrValueToString),
			buildCustomNumberParamDesc('decay', 0, 0, 0, 32, 3, adsrValueToString),
			buildCustomNumberParamDesc('sustain', 0, 0, 0, 1, 1, gainDecibelValueToString),
			buildCustomNumberParamDesc('release', 0, 0, 0, 32, 3, adsrValueToString),
		])

		super(id, audioContext, preMasterLimiter, inPorts, outPorts, audioParams, customNumberParams)

		// Make sure to add these to the dispose method!
		this._constantSource = constantSource
		this._outputGain = outputGain
		// TODO Temporary
		this._intervalId = setInterval(() => {
			this.receiveGateSignal(true, this.audioContext.currentTime + 0.5)
			this.receiveGateSignal(false, this.audioContext.currentTime + 1.5)
		}, 1000)
	}

	public getColor(): string {
		return CssColor.blue
	}

	public getName() {return 'Envelope'}

	public onNumberParamChange(paramChange: NumberParamChange) {
		switch (paramChange.paramId) {
			case 'attack': return
			case 'decay': return
			case 'sustain': return
			case 'release': return
			default: return logger.warn('unhandled number param change: ', {paramChange})
		}
	}

	public receiveGateSignal(signal: boolean, start: number) {
		const offset = this._constantSource.offset
		if (signal) {
			const attackEnd = start + this._attackSeconds
			const holdEnd = attackEnd + this._holdSeconds
			const decayEnd = holdEnd + this._decaySeconds
			const farOut = decayEnd + longTime
			offset.cancelAndHoldAtTime(start)
			offset.linearRampToValueAtTime(1, attackEnd)
			offset.linearRampToValueAtTime(1, holdEnd)
			offset.linearRampToValueAtTime(Math.max(0.0001, this._sustain), decayEnd)
			offset.linearRampToValueAtTime(this._sustain, farOut)
		} else {
			const releaseEnd = start + this._releaseSeconds
			const farOut = releaseEnd + longTime
			offset.cancelAndHoldAtTime(start)
			offset.linearRampToValueAtTime(0.0001, releaseEnd)
			offset.linearRampToValueAtTime(0, farOut)
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
		clearInterval(this._intervalId)
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
}
