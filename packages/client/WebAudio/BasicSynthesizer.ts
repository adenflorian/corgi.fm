import {BuiltInOscillatorType, CustomOscillatorType, LfoOscillatorType, ShamuOscillatorType} from '@corgifm/common/OscillatorTypes'
import {SynthLfoTarget} from '@corgifm/common/redux'
import {
	midiNoteToFrequency, Voice, Voices, IInstrumentOptions, Instrument,
	OnEndedCallback, TunableAudioScheduledSourceNode,
} from './index'

interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
	lfoRate: number
	lfoAmount: number
	lfoWave: LfoOscillatorType
	lfoTarget: SynthLfoTarget
}

// TODO Make into a BasicSynthesizerAudioNode?
export class BasicSynthesizer extends Instrument<SynthVoices, SynthVoice> {
	private readonly _voices: SynthVoices
	private readonly _lfoGain: GainNode
	private readonly _lfo: OscillatorNode
	private _lfoAmountMultiplier: number = 1
	private _oscillatorType: ShamuOscillatorType
	private _lfoRate: number
	private _lfoAmount: number
	private _lfoTarget: SynthLfoTarget
	private _lfoWave: LfoOscillatorType
	private readonly _lfoWaveShaper: WaveShaperNode

	public constructor(options: IBasicSynthesizerOptions) {
		super(options)

		this._oscillatorType = options.oscillatorType

		this._lfoRate = options.lfoRate
		this._lfoAmount = options.lfoAmount
		this._lfoWave = options.lfoWave
		this._lfoTarget = options.lfoTarget

		this._lfo = options.audioContext.createOscillator()
		this._updateLfoWave()
		this._updateLfoRate()
		this._lfo.start()

		this._lfoGain = options.audioContext.createGain()
		this._updateLfoAmount()

		this._lfoWaveShaper = this._audioContext.createWaveShaper()

		this._lfo.connect(this._lfoWaveShaper)
		this._lfoWaveShaper.connect(this._lfoGain)

		this._updateLfoTarget()

		this._voices = new SynthVoices(
			this._audioContext,
			this._panNode,
			options.oscillatorType,
			this._detune,
			this._lowPassFilterCutoffFrequency,
			this._lfoRate,
			this._lfoAmount,
			this._lfoTarget,
			this._lfoWave,
		)
	}

	public setOscillatorType = (type: ShamuOscillatorType) => {
		if (type === this._oscillatorType) return
		this._oscillatorType = type
		this._voices.setOscillatorType(type)
	}

	public readonly setLfoRate = (rate: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newRate = Math.fround(rate)
		if (newRate === this._lfoRate) return
		this._lfoRate = newRate
		this._getVoices().setLfoRate(newRate)
		this._updateLfoRate()
	}

	private readonly _updateLfoRate = () => {
		const rate = this._lfoWave === LfoOscillatorType.reverseSawtooth
			? -this._lfoRate
			: this._lfoRate

		this._lfo.frequency.linearRampToValueAtTime(rate, this._audioContext.currentTime + 0.004)
	}

	public readonly setLfoAmount = (amount: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newAmount = Math.fround(amount)
		if (newAmount === this._lfoAmount) return
		this._lfoAmount = newAmount
		this._getVoices().setLfoAmount(newAmount)
		this._updateLfoAmount()
	}

	private readonly _updateLfoAmount = () => {
		this._lfoGain.gain.linearRampToValueAtTime(this._lfoAmount * this._lfoAmountMultiplier, this._audioContext.currentTime + 0.004)
	}

	public readonly setLfoWave = (wave: LfoOscillatorType) => {
		if (wave === this._lfoWave) return
		this._lfoWave = wave
		this._getVoices().setLfoWave(wave)
		this._updateLfoWave()
	}

	private readonly _updateLfoWave = () => {
		this._lfo.type = this._lfoWave === LfoOscillatorType.reverseSawtooth
			? LfoOscillatorType.sawtooth
			: this._lfoWave

		this._updateLfoRate()
	}

	public readonly setLfoTarget = (target: SynthLfoTarget) => {
		if (target === this._lfoTarget) return
		this._lfoTarget = target
		this._getVoices().setLfoTarget(target)

		this._updateLfoTarget()
	}

	public readonly syncOscillatorStartTimes = (startTime: number, bpm: number) => {
		// this._lfo.stop()
		// this._lfo.disconnect()
		// this._lfo = this._audioContext.createOscillator()
		// this._lfo.connect(this._lfoGain)
		// // this._lfo.frequency.setValueAtTime(this._lfoRate, startTime)
		// this._updateLfoRate()
		// this._updateLfoWave()
		// this._updateLfoTarget()
		// this._updateLfoAmount()
		// this._lfo.start(startTime + (((bpm / 60) * this._lfoRate) / 16))
	}

	private readonly _updateLfoTarget = () => {
		this._lfoGain.disconnect()

		switch (this._lfoTarget) {
			// Will output node always be the gain?
			case SynthLfoTarget.Gain:
				this._lfoAmountMultiplier = 1
				this._lfoWaveShaper.curve = new Float32Array([-1, 0])
				this._lfoGain.connect(this._lfoGainTarget.gain)
				break
			case SynthLfoTarget.Pan:
				this._lfoAmountMultiplier = 1
				this._lfoWaveShaper.curve = new Float32Array([-1, 1])
				this._lfoGain.connect(this._panNode.pan)
				break
			case SynthLfoTarget.Filter:
				this._lfoAmountMultiplier = 20000
				this._lfoWaveShaper.curve = new Float32Array([-1, 1])
				this._lfoGain.connect(this._filter.frequency)
				break
		}

		this._updateLfoAmount()
	}

	protected _getVoices = () => this._voices
}

class SynthVoices extends Voices<SynthVoice> {
	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		private _oscType: ShamuOscillatorType,
		_detune: number,
		_lowPassFilterCutoffFrequency: number,
		private _lfoRate: number,
		private _lfoAmount: number,
		private _lfoTarget: SynthLfoTarget,
		private _lfoWave: LfoOscillatorType,
	) {
		super(_detune, _lowPassFilterCutoffFrequency)
	}

	protected _createVoice(invincible: boolean) {
		return new SynthVoice(
			this._audioContext,
			this._destination,
			this._oscType,
			this._detune,
			this._lowPassFilterCutoffFrequency,
			this._getOnEndedCallback(),
			invincible,
			// this._lfoRate,
			// this._lfoAmount,
			// this._lfoTarget,
			// this._lfoWave,
		)
	}

	public setOscillatorType(type: ShamuOscillatorType) {
		this._oscType = type
		this._allVoices.forEach(x => x.setOscillatorType(type))
	}

	public readonly setLfoRate = (rate: number) => {
		this._lfoRate = rate
		this._allVoices.forEach(x => x.setLfoRate(rate))
	}

	public readonly setLfoAmount = (amount: number) => {
		this._lfoAmount = amount
		this._allVoices.forEach(x => x.setLfoAmount(amount))
	}

	public readonly setLfoWave = (wave: LfoOscillatorType) => {
		this._lfoWave = wave
		this._allVoices.forEach(x => x.setLfoWave(wave))
	}

	public readonly setLfoTarget = (target: SynthLfoTarget) => {
		this._lfoTarget = target
		this._allVoices.forEach(x => x.setLfoTarget(target))
	}

	protected _getAudioContext() {return this._audioContext}
}

class SynthVoice extends Voice {
	private static _noiseBuffer: AudioBuffer
	private _oscillator: OscillatorNode | undefined
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _whiteNoise: AudioBufferSourceNode | undefined

	public constructor(
		audioContext: AudioContext,
		destination: AudioNode,
		oscType: ShamuOscillatorType,
		detune: number,
		lowPassFilterCutoffFrequency: number,
		onEnded: OnEndedCallback,
		invincible: boolean,
		// private _lfoRate: number,
		// private _lfoAmount: number,
		// private _lfoTarget: SynthLfoTarget,
		// private _lfoWave: LfoOscillatorType,
	) {
		super(audioContext, destination, onEnded, detune, lowPassFilterCutoffFrequency, invincible)

		this._oscillatorType = oscType
		this._nextOscillatorType = oscType

		if (!SynthVoice._noiseBuffer) {
			SynthVoice._noiseBuffer = this._generateNoiseBuffer()
		}
	}

	// TODO Maybe change to just stopAudioNode
	public getAudioScheduledSourceNode(): TunableAudioScheduledSourceNode | undefined {
		if (this._oscillatorType === CustomOscillatorType.noise) {
			return this._whiteNoise
		} else {
			return this._oscillator
		}
	}

	public setOscillatorType(newOscType: ShamuOscillatorType) {
		this._nextOscillatorType = newOscType

		this._refreshOscillatorType()

		// if release is scheduled, need to call stop on new node
		if (this._isReleaseScheduled) {
			if (this._whiteNoise) {
				this._whiteNoise.stop(this.scheduledReleaseEndTimeSeconds)
				this._whiteNoise.onended = () => this._onEnded(this.id)
			}
			if (this._oscillator) {
				this._oscillator.stop(this.scheduledReleaseEndTimeSeconds)
				this._oscillator.onended = () => this._onEnded(this.id)
			}
		}
	}

	public setLfoRate(rate: number) {
		// TODO
	}

	public setLfoAmount(amount: number) {
		// TODO
	}

	public setLfoWave(wave: LfoOscillatorType) {
		// TODO
	}

	public setLfoTarget(target: SynthLfoTarget) {
		// TODO
	}

	public dispose() {
		this._deleteChain()
		this._dispose()
	}

	protected _scheduleNoteSpecific(note: number): void {
		if (this._oscillatorType === CustomOscillatorType.noise) {
			this._scheduleNoiseNote(note)
		} else {
			this._scheduleNormalNote(note)
		}
	}

	private _scheduleNormalNote(note: number): void {
		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.type = this._oscillatorType as OscillatorType
		// TODO Just set it immediately
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(note), this._audioContext.currentTime)
	}

	private _scheduleNoiseNote(_: number): void {
		this._whiteNoise = this._audioContext.createBufferSource()
		this._whiteNoise.buffer = SynthVoice._noiseBuffer
		this._whiteNoise.loop = true
	}

	private _refreshOscillatorType() {
		if (this._oscillatorType !== this._nextOscillatorType) {
			const oldOscType = this._oscillatorType
			this._oscillatorType = this._nextOscillatorType

			if (this._oscillatorType in BuiltInOscillatorType && oldOscType in BuiltInOscillatorType) {
				if (this._oscillator) {
					this._oscillator.type = this._oscillatorType as OscillatorType
				}
			} else {
				this._rebuildChain()
			}
		}
	}

	private _rebuildChain() {
		this._deleteChain()
		this._buildChain()
	}

	private _generateNoiseBuffer() {
		const bufferSize = 2 * this._audioContext.sampleRate
		const buffer = this._audioContext.createBuffer(1, bufferSize, this._audioContext.sampleRate)
		const output = buffer.getChannelData(0)

		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1
		}

		return buffer
	}

	private _buildChain() {
		this._buildSpecificChain().connect(this._gain)
			.connect(this._destination)
	}

	private _buildSpecificChain(): AudioNode {
		if (this._oscillatorType === CustomOscillatorType.noise) {
			return this._buildNoiseChain()
		} else {
			return this._buildNormalChain()
		}
	}

	private _buildNoiseChain(): AudioNode {
		this._whiteNoise = this._audioContext.createBufferSource()
		this._whiteNoise.start()
		this._whiteNoise.buffer = SynthVoice._noiseBuffer
		this._whiteNoise.loop = true

		return this._whiteNoise
	}

	private _buildNormalChain(): AudioNode {
		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.start()
		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(this.playingNote), this._audioContext.currentTime)

		return this._oscillator
	}

	private _deleteChain() {
		if (this._oscillator) {
			this._oscillator.stop()
			this._oscillator.disconnect()
			delete this._oscillator
		}
		if (this._whiteNoise) {
			this._whiteNoise.stop()
			this._whiteNoise.disconnect()
			delete this._whiteNoise
		}
	}
}
