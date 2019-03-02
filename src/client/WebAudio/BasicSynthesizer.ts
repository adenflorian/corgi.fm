import {IMidiNote} from '../../common/MidiNote'
import {midiNoteToFrequency} from '../../common/music-functions'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import {IInstrumentOptions, Instrument, VoiceStatus} from './index'
import {InnerVoice} from './Instrument'

export interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
	detune: number
}

// TODO Make into a BasicSynthesizerAudioNode?
export class BasicSynthesizer extends Instrument {
	private _detune: number = 0
	private _oscillatorType: ShamuOscillatorType

	constructor(options: IBasicSynthesizerOptions) {
		super(options)

		this._oscillatorType = options.oscillatorType
		this._detune = options.detune
	}

	public setOscillatorType = (type: ShamuOscillatorType) => {
		if (type === this._oscillatorType) return
		this._oscillatorType = type
	}

	public setFineTuning = (fine: number) => {
		if (fine === this._detune) return
		this._detune = fine
	}
}

export class SynthVoice implements InnerVoice {
	private _oscillator: OscillatorNode
	private _frequency: number = 0

	constructor(
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		private _oscillatorType: BuiltInOscillatorType,
		private readonly _forScheduling: boolean,
		private _detune: number,
	) {
		if (this._forScheduling === false) {
			this._buildChain()
		}

		this._oscillator = this._audioContext.createOscillator()
	}

	public setOscillatorType(newOscType: BuiltInOscillatorType) {
		this._oscillatorType = newOscType

		// if (this._status === VoiceStatus.playing) {
		this._refreshOscillatorType()
		// }
	}

	public setFineTuning(detune: number) {
		if (detune === this._detune) return

		this._detune = detune
		this._oscillator.detune.value = detune
	}

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		this._attackStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._attackEndTimeSeconds = this._attackStartTimeSeconds + attackTimeInSeconds

		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.detune.value = this._detune
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(note), this._audioContext.currentTime)
		this._oscillator.start(this._attackStartTimeSeconds)

		// logger.log(this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)

		this._oscillator.connect(this._destination)
	}

	public playNote(note: number) {
		this._frequency = midiNoteToFrequency(note)

		if (this._oscillator) {
			this._oscillator.frequency.value = this._frequency
		}

		this._refreshOscillatorType()
	}

	public dispose() {
		this._deleteChain()
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
		return this._buildNormalChain()
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
	}
}

export class NoiseVoice implements InnerVoice {
	private static _noiseBuffer: AudioBuffer
	private _whiteNoise: AudioBufferSourceNode

	constructor(
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		private readonly _forScheduling: boolean,
	) {
		if (!NoiseVoice._noiseBuffer) {
			NoiseVoice._noiseBuffer = this._generateNoiseBuffer()
		}
		this._whiteNoise = this._audioContext.createBufferSource()
	}

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		// TODO
	}

	public scheduleRelease(delaySeconds: number, releaseSeconds: number, onEnded: () => void) {
		// TODO
	}

	public playNote() {
		this._buildNoiseChain().connect(this._destination)
	}

	public dispose() {
		this._whiteNoise.stop()
		this._whiteNoise.disconnect()
		delete this._whiteNoise
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

	private _buildNoiseChain(): AudioNode {
		this._whiteNoise.start()
		this._whiteNoise.buffer = NoiseVoice._noiseBuffer
		this._whiteNoise.loop = true

		return this._whiteNoise
	}
}
