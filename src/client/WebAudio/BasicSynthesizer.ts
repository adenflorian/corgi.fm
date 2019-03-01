import {midiNoteToFrequency} from '../../common/music-functions'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import {IInstrumentOptions, Voice, VoiceStatus} from './index'

export interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
}

// TODO Make into a BasicSynthesizerAudioNode?
// export class BasicSynthesizer extends Instrument<SynthVoices, SynthVoice> {
// 	private readonly _voices: SynthVoices
// 	private _fineTuning: number = 0
// 	private _oscillatorType: ShamuOscillatorType

// 	constructor(options: IBasicSynthesizerOptions) {
// 		super(options)

// 		this._oscillatorType = options.oscillatorType

// 		this._voices = new SynthVoices(options.voiceCount, this._audioContext, this._panNode, options.oscillatorType, this._fineTuning)
// 	}

// 	public scheduleNote(note: IMidiNote, delaySeconds: number) {
// 		this._voices.scheduleNote(note, delaySeconds, this._attackTimeInSeconds, this._audioContext, this._panNode, this._oscillatorType, this._fineTuning)
// 	}

// 	public setOscillatorType = (type: ShamuOscillatorType) => {
// 		if (type === this._oscillatorType) return
// 		this._oscillatorType = type
// 		this._voices.setOscillatorType(type)
// 	}

// 	public setFineTuning = (fine: number) => {
// 		if (fine === this._fineTuning) return
// 		this._fineTuning = fine
// 		this._voices.setFineTuning(fine)
// 	}

// 	public dispose = () => {
// 		this._voices.dispose()

// 		this._dispose()
// 	}

// 	protected _getVoices = () => this._voices
// }

export class SynthVoice extends Voice {
	private static _noiseBuffer: AudioBuffer
	private _oscillator: OscillatorNode | undefined
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _whiteNoise: AudioBufferSourceNode | undefined
	private _fineTuning: number = 0
	private _frequency: number = 0

	constructor(
		audioContext: AudioContext, destination: AudioNode,
		oscType: ShamuOscillatorType, forScheduling: boolean, detune: number,
	) {
		super(audioContext, destination)

		this._oscillatorType = oscType
		this._nextOscillatorType = oscType
		this._fineTuning = detune

		if (!SynthVoice._noiseBuffer) {
			SynthVoice._noiseBuffer = this._generateNoiseBuffer()
		}

		if (forScheduling === false) {
			this._buildChain()
		}
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSynthNote(note)

		this._afterPlayNote(note)
	}

	public scheduleRelease(delaySeconds: number, releaseSeconds: number, onEnded: () => void) {

		if (this._oscillatorType === CustomOscillatorType.noise) {
			// TODO
		} else {
			this._scheduleReleaseNormalNote(delaySeconds, releaseSeconds, onEnded)
		}

		this._isReleaseScheduled = true
	}

	public setOscillatorType(newOscType: ShamuOscillatorType) {
		this._nextOscillatorType = newOscType

		if (this._status === VoiceStatus.playing) {
			this._refreshOscillatorType()
		}
	}

	public setFineTuning(fine: number) {
		if (fine === this._fineTuning) return
		this._fineTuning = fine
		if (this._oscillator) {
			this._oscillator.detune.value = fine
		}
	}

	public dispose() {
		this._deleteChain()
		this._dispose()
	}

	protected _scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		if (this._oscillatorType === CustomOscillatorType.noise) return // TODO

		this._attackStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._attackEndTimeSeconds = this._attackStartTimeSeconds + attackTimeInSeconds

		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.detune.value = this._fineTuning
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(note), this._audioContext.currentTime)
		this._oscillator.start(this._attackStartTimeSeconds)

		// logger.log(this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0
		this._gain.gain.linearRampToValueAtTime(0, this._attackStartTimeSeconds)
		this._gain.gain.linearRampToValueAtTime(this._sustainLevel, this._attackEndTimeSeconds)

		this._oscillator.connect(this._gain)
			.connect(this._destination)
	}

	private _scheduleReleaseNormalNote(delaySeconds: number, releaseSeconds: number, onEnded: () => void) {
		this._scheduleReleaseNormalNoteGeneric(delaySeconds, releaseSeconds, this._oscillator, onEnded)
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
