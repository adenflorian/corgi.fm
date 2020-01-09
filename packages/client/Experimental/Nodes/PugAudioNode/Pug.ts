import {logger} from '../../../client-logger'
import {clamp, CurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {SignalRange} from '@corgifm/common/common-types'
import * as Immutable from 'immutable'

export type PugMode = 'mono' | 'poly'
export type PugTarget = PugNode | PugParam
export type PugVoiceCount = number | 'mono'

export class PugNode {
	private readonly _connectedTargets = new Set<PugTarget>()
	public readonly voices: PugVoices

	public constructor(newCount: PugVoiceCount, voiceMaker: VoiceMaker) {
		this.voices = new PugVoices(voiceMaker, newCount)
	}

	public setVoiceCount(newCount: PugVoiceCount) {
		this.voices.setVoiceCount(newCount)
	}

	public connect(target: PugTarget) {
		this.voices.connect(target.voices)
		this._connectedTargets.add(target)
	}

	public disconnect(target?: PugTarget) {
		if (target) {
			this._connectedTargets.delete(target)
		} else {
			this._connectedTargets.clear()
		}
	}

	public dispose() {
		this.disconnect()
	}
}

export class PugParam {
	private readonly _connectedSources = new Set<PugNode>()
	public readonly voices: PugVoices

	public constructor(
		public readonly pugNode: PugNode,
	) {
		this.voices = new PugVoices(new VoiceMaker(), this.pugNode.voices.voiceCount)
	}

	public onConnect(source: PugNode) {
		this._connectedSources.add(source)
	}

	public dispose() {}
}

const minVoiceCount = 1
const maxVoiceCount = 16

export class PugVoices {
	public readonly _voices = [] as PugVoice[]
	private readonly _connectedTargets = new Set<PugVoices>()
	private readonly _connectedSources = new Set<PugVoices>()
	public get voiceCount() {return this._voiceCount}

	public constructor(
		private readonly _voiceMaker: VoiceMaker,
		private _voiceCount: PugVoiceCount,
	) {
		this.setVoiceCount(this._voiceCount)
	}

	public setVoiceCount(newCount: PugVoiceCount) {
		let actualNewCount: number
	
		if (newCount === 'mono') {
			actualNewCount = 1
		} else {
			actualNewCount = clamp(newCount, minVoiceCount, maxVoiceCount)
		}

		const delta = actualNewCount - this._voices.length
	
		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			return
		}

		logger.assert(this._voices.length === actualNewCount, 'this._voices.length === actualNewCount')
	}

	private _addVoices(numberToAdd: number) {
		for (let i = 0; i < numberToAdd; i++) {
			this._voices.push(this._voiceMaker.makeVoice())
		}
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedPugVoice = this._voices.pop()
			if (deletedPugVoice === undefined) {
				logger.error('[PugVoices._deleteVoices] deletedPugVoice is undefined:', {source: this, voices: this._voices, numberToDelete})
			} else {
				deletedPugVoice.dispose()
			}
		}
	}

	public connect(target: PugVoices) {
		const targetVoices = target.onConnect(this)
		this._connectVoices(this._voices, targetVoices)
		this._connectedTargets.add(target)
	}

	private _connectVoices(thisVoices: readonly PugVoice[], targetVoices: readonly PugVoice[]) {
		if (thisVoices.length > 1) {
			if (targetVoices.length > 1) {
				// poly to poly
				this._voices.forEach((voice, i) => {
					voice.connect(targetVoices[i])
				})
			} else {
				// poly to mono
				this._voices.forEach((voice, i) => {
					voice.connect(targetVoices[0])
				})
			}
		} else {
			if (targetVoices.length > 1) {
				// mono to poly
				targetVoices.forEach((voice, i) => {
					this._voices[0].connect(voice)
				})
			} else {
				// mono to mono
				this._voices[0].connect(targetVoices[0])
			}
		}
	}

	public onConnect(source: PugVoices): PugVoice[] {
		this._connectedSources.add(source)
		return this._voices
	}

	public dispose() {
		this._voices.forEach(voice => voice.dispose())
	}
}

export class VoiceMaker {
	public constructor(
		public readonly makeVoice: () => PugVoice,
	) {}
	public dispose() {}
}

export class PugVoice {
	public connect(target: PugVoice) {}
	public disconnect(target?: PugVoice) {}
	public dispose() {}
}

const minUnisonCount = 1
const maxUnisonCount = 16

interface PugAudioParamArgs {
	readonly id: Id
	readonly default: number
	readonly min: number
	readonly max: number
	// readonly param: AudioParam
	readonly paramSignalRange: SignalRange,
	readonly valueString?: (v: number) => string
	readonly curveFunctions?: CurveFunctions
	readonly onChange?: (newValue: number) => void
}

class PugAudioParam {
	readonly id: Id
	public get value() {return this._value}
	private _value: number

	public constructor(private readonly _args: PugAudioParamArgs) {
		this.id = this._args.id
		this._value = this._args.default
	}
}

interface PugEnumParamArgs<T, TEnum extends string> {
	readonly id: Id
	readonly default: TEnum
	readonly onChange: (thing: T) => (newValue: TEnum) => void
}

class PugEnumParam<T, TEnum extends string> {
	readonly id: Id
	public get value() {return this._value}
	private _value: TEnum

	public constructor(private readonly _args: PugEnumParamArgs<T, TEnum>) {
		this.id = this._args.id
		this._value = this._args.default
	}
}

interface PugNumberParamArgs<T> {
	readonly id: Id
	readonly default: number
	readonly min: number
	readonly max: number
	readonly onChange: (thing: T) => (newValue: number) => void
}

class PugNumberParam<T> {
	readonly id: Id
	public get value() {return this._value}
	private _value: number

	public constructor(private readonly _args: PugNumberParamArgs<T>) {
		this.id = this._args.id
		this._value = this._args.default
	}
}

abstract class Wrapper {
	protected readonly abstract _audioParams: Immutable.Map<Id, PugAudioParam>

	public constructor(protected readonly _audioContext: AudioContext) {}

	public setAudioParamValueAtTime(name: string, newValue: number, time: number) {
		this._withParam(name, param => {
			// param.
		})
	}

	private _withParam(name: string, func: (param: PugAudioParam) => void) {
		const param = this._audioParams.get(name)
		if (param) {
			func(param)
		} else {
			logger.error('404 param not found', {name, this: this})
		}
	}
}

export class MyMegaOscillatorUber extends Wrapper {
	protected readonly _audioParams: Immutable.Map<Id, PugAudioParam>
	private readonly _frequency: PugAudioParam
	private readonly _detune: PugAudioParam
	private readonly _unisonCount: PugNumberParam<MyMegaOscillator>
	private readonly _unisonDetune: PugNumberParam<MyMegaOscillator>
	private readonly _waveType: PugEnumParam<MyMegaOscillator, OscillatorType>
	private readonly _pugNode: PugNode

	public constructor(audioContext: AudioContext) {
		super(audioContext)

		this._pugNode = new PugNode(1, new VoiceMaker(this.make))

		this._frequency = new PugAudioParam({
			id: 'frequency',
			default: 220,
			min: 0,
			max: 20000,
			paramSignalRange: 'unipolar',
		})
		this._detune = new PugAudioParam({
			id: 'detune',
			default: 0,
			min: -100,
			max: 100,
			paramSignalRange: 'bipolar',
			// getParam: osc => osc.setUnisonCount
		})
		this._unisonCount = new PugNumberParam<MyMegaOscillator>({
			id: 'unisonCount',
			default: 1,
			min: 1,
			max: 16,
			onChange: osc => osc.setUnisonCount
		})
		this._unisonDetune = new PugNumberParam<MyMegaOscillator>({
			id: 'unisonDetune',
			default: 0,
			min: 0,
			max: 1,
			onChange: osc => osc.setUnisonDetune
		})
		this._waveType = new PugEnumParam<MyMegaOscillator, OscillatorType>({
			id: 'unisonDetune',
			default: 'sawtooth',
			onChange: osc => osc.setWaveType
		})
		this._audioParams = Immutable.Map(arrayToESIdKeyMap([this._frequency, this._detune]))
	}
	public readonly make = () => {
		return new MyMegaOscillator(this._audioContext)
	}
}

class AudioParamWrapper {
	public constructor(private readonly _audioParam: AudioParam) {}

	public get automationRate() {return this._audioParam.automationRate}
	public get defaultValue() {return this._audioParam.defaultValue}
	public get maxValue() {return this._audioParam.maxValue}
	public get minValue() {return this._audioParam.minValue}
	public get value() {return this._audioParam.value}
	public cancelAndHoldAtTime(cancelTime: number) {
		this._audioParam.cancelAndHoldAtTime(cancelTime)
	}
	public cancelScheduledValues(cancelTime: number) {
		this._audioParam.cancelScheduledValues(cancelTime)
	}
	public exponentialRampToValueAtTime(value: number, endTime: number) {
		this._audioParam.exponentialRampToValueAtTime(value, endTime)
	}
	public linearRampToValueAtTime(value: number, endTime: number) {
		this._audioParam.linearRampToValueAtTime(value, endTime)
	}
	public setTargetAtTime(target: number, startTime: number, timeConstant: number) {
		this._audioParam.setTargetAtTime(target, startTime, timeConstant)
	}
	public setValueAtTime(value: number, startTime: number) {
		this._audioParam.setValueAtTime(value, startTime)
	}
	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number) {
		this._audioParam.setValueCurveAtTime(values, startTime, duration)
	}
}

export class MyMegaOscillator {
	private _oscillators = [] as OscillatorNode[]
	private _gainInput: GainNode
	private _gainOutput: GainNode

	public constructor(
		private readonly _audioContext: AudioContext,
	) {
		this._gainInput = this._audioContext.createGain()
		this._gainOutput = this._audioContext.createGain()
	}

	public readonly setUnisonCount = (newCount: number) => {
		const actualNewCount = clamp(newCount, minUnisonCount, maxUnisonCount)

		const delta = actualNewCount - this._oscillators.length

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			return
		}

		logger.assert(this._oscillators.length === actualNewCount, 'this._oscillators.length === actualNewCount')
	}

	public readonly setUnisonDetune = (newDetune: number) => {
		const clampedDetune = clamp(newDetune, 0, 1)
	}

	public readonly setWaveType = (newWaveType: OscillatorType) => {
		this._oscillators.forEach(osc => osc.type = newWaveType)
	}

	private _addVoices(numberToAdd: number) {
		for (let i = 0; i < numberToAdd; i++) {
			this._oscillators.push(this._makeOsc())
		}
		this._updateUnisonDetune()
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedOsc = this._oscillators.pop()
			if (deletedOsc === undefined) {
				logger.error('[MyMegaOscillator._deleteVoices] deletedOsc is undefined:', {source: this, voices: this._oscillators, numberToDelete})
			} else {
				this._gainInput.disconnect(deletedOsc)
				deletedOsc.disconnect()
			}
		}
		this._updateUnisonDetune()
	}

	private _updateUnisonDetune() {
		// TODO
	}

	private _makeOsc() {
		const newOsc = this._audioContext.createOscillator()
		newOsc.frequency.setValueAtTime(this._frequency.value, 0)
		newOsc.detune.setValueAtTime(this._detune.value, 0)
		newOsc.type = this._waveType.value
		this._gainInput.connect(newOsc).connect(this._gainOutput)
		return newOsc
	}

	public dispose() {
		this._oscillators.forEach(osc => {
			osc.stop()
			osc.disconnect()
		})
		this._gainInput.disconnect()
		this._gainOutput.disconnect()
	}
}
