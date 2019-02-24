import {logger} from '../../common/logger'
import {IMidiNote} from '../../common/MidiNote'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import {IInstrumentOptions, Instrument, Voice, Voices, VoiceStatus} from './Instrument'
import {midiNoteToFrequency} from './music-functions'

export interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
}

// TODO Make into a BasicSynthesizerAudioNode?
export class BasicSynthesizer extends Instrument<SynthVoices, SynthVoice> {
	private readonly _voices: SynthVoices
	private _fineTuning: number = 0
	private _oscillatorType: ShamuOscillatorType

	constructor(options: IBasicSynthesizerOptions) {
		super(options)

		this._oscillatorType = options.oscillatorType

		this._voices = new SynthVoices(options.voiceCount, this._audioContext, this._panNode, options.oscillatorType)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number) {
		this.createVoice().scheduleNote(note, this._attackTimeInSeconds, delaySeconds)
	}

	public createVoice() {
		return SynthVoices.createVoice(this._audioContext, this._panNode, this._oscillatorType)
	}

	public setOscillatorType = (type: ShamuOscillatorType) => {
		if (type === this._oscillatorType) return
		this._oscillatorType = type
		this._voices.setOscillatorType(type)
	}

	public setFineTuning = (fine: number) => {
		if (fine === this._fineTuning) return
		this._fineTuning = fine
		this._voices.setFineTuning(fine)
	}

	public dispose = () => {
		this._voices.dispose()

		this._dispose()
	}

	protected _getVoices = () => this._voices
}

class SynthVoices extends Voices<SynthVoice> {

	public static createVoice(audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		return new SynthVoice(audioContext, destination, oscType)
	}

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		super()

		for (let i = 0; i < voiceCount; i++) {
			this._inactiveVoices.push(SynthVoices.createVoice(audioContext, destination, oscType))
		}
	}

	public setOscillatorType(type: ShamuOscillatorType) {
		this._allVoices.forEach(x => x.setOscillatorType(type))
	}

	public setFineTuning(fine: number) {
		this._allVoices.forEach(x => x.setFineTuning(fine))
	}
}

class SynthVoice extends Voice {
	private static _noiseBuffer: AudioBuffer
	private _oscillator: OscillatorNode | undefined
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _whiteNoise: AudioBufferSourceNode | undefined
	private _fineTuning: number = 0
	private _frequency: number = 0

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		super(audioContext, destination)

		this._oscillatorType = oscType
		this._nextOscillatorType = oscType

		if (!SynthVoice._noiseBuffer) {
			SynthVoice._noiseBuffer = this._generateNoiseBuffer()
		}

		this._buildChain()
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSynthNote(note)

		this._afterPlayNote(note)
	}

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) throw new Error('delay <= 0: ' + delaySeconds)

		const release = 0.2

		if (this._oscillatorType === CustomOscillatorType.noise) {
			// TODO
		} else {
			this._scheduleNormalNote(note, attackTimeInSeconds, delaySeconds, release)
		}
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

	private _scheduleNormalNote(note: number, attackTimeInSeconds: number, delaySeconds: number, release: number): void {
		// logger.log('synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note)
		const oscA = this._audioContext.createOscillator()
		oscA.type = this._oscillatorType as OscillatorType
		oscA.detune.value = this._fineTuning
		oscA.start(this._audioContext.currentTime + delaySeconds)
		oscA.stop(this._audioContext.currentTime + delaySeconds + attackTimeInSeconds + release)
		oscA.frequency.setValueAtTime(midiNoteToFrequency(note), this._audioContext.currentTime)

		let gain: GainNode

		// if (gains.length > 0) {
		// 	gain = gains.shift()!
		// } else {
		gain = this._audioContext.createGain()
		// }

		// gain.gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		gain.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + delaySeconds)
		gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + delaySeconds + attackTimeInSeconds)
		// gain.gain.value = 1
		gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + delaySeconds + attackTimeInSeconds + release)

		oscA.connect(gain)
			.connect(this._destination)
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
