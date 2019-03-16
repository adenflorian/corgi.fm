import {IInstrumentOptions, Instrument, OnEndedCallback, TunableAudioScheduledSourceNode} from '.'
import {logger} from '../../common/logger'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import {midiNoteToFrequency, Voice, Voices} from './index'

interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
	detune: number
}

// TODO Make into a BasicSynthesizerAudioNode?
export class BasicSynthesizer extends Instrument<SynthVoices, SynthVoice> {
	private readonly _voices: SynthVoices
	private _oscillatorType: ShamuOscillatorType

	constructor(options: IBasicSynthesizerOptions) {
		super(options)

		this._oscillatorType = options.oscillatorType

		this._voices = new SynthVoices(
			options.voiceCount,
			this._audioContext,
			this._panNode,
			options.oscillatorType,
			this._detune,
			options.forScheduling,
		)
	}

	public setOscillatorType = (type: ShamuOscillatorType) => {
		if (type === this._oscillatorType) return
		this._oscillatorType = type
		this._voices.setOscillatorType(type)
	}

	protected _getVoices = () => this._voices
}

class SynthVoices extends Voices<SynthVoice> {
	constructor(
		private readonly _voiceCount: number,
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		private _oscType: ShamuOscillatorType,
		_detune: number,
		forScheduling = true,
	) {
		super(_detune)

		if (forScheduling) return

		for (let i = 0; i < this._voiceCount; i++) {
			const newVoice = this._createVoice(false, false)

			this._inactiveVoices = this._inactiveVoices.set(newVoice.id, newVoice)
		}
	}

	protected _createVoice(forScheduling: boolean, invincible: boolean) {
		return new SynthVoice(
			this._audioContext,
			this._destination,
			this._oscType,
			forScheduling,
			this._detune,
			this._getOnEndedCallback(),
			invincible,
		)
	}

	public setOscillatorType(type: ShamuOscillatorType) {
		this._oscType = type
		this._allVoices.forEach(x => x.setOscillatorType(type))
	}

	protected _getAudioContext() {return this._audioContext}
}

class SynthVoice extends Voice {
	private static _noiseBuffer: AudioBuffer
	private _oscillator: OscillatorNode | undefined
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _whiteNoise: AudioBufferSourceNode | undefined
	private _frequency: number = 0

	constructor(
		audioContext: AudioContext, destination: AudioNode,
		oscType: ShamuOscillatorType, forScheduling: boolean, detune: number,
		onEnded: OnEndedCallback,
		invincible: boolean,
	) {
		super(audioContext, destination, onEnded, detune, invincible)

		this._oscillatorType = oscType
		this._nextOscillatorType = oscType

		if (!SynthVoice._noiseBuffer) {
			SynthVoice._noiseBuffer = this._generateNoiseBuffer()
		}

		if (forScheduling === false) {
			this._buildChain()
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

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSynthNote(note)

		this._afterPlayNote(note)
	}

	public setOscillatorType(newOscType: ShamuOscillatorType) {
		this._nextOscillatorType = newOscType

		// TODO This might be needed for old system
		// if (this._status === VoiceStatus.playing) {
		this._refreshOscillatorType()
		// }

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

	private _playSynthNote(note: number) {
		this._frequency = midiNoteToFrequency(note)
		if (this._oscillator) {
			this._oscillator.frequency.value = this._frequency
		}
		this._refreshOscillatorType()
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
