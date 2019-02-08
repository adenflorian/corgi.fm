import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import {midiNoteToFrequency} from '../music/music-functions'
import {IInstrumentOptions, Instrument, Voice, Voices, VoiceStatus} from './Instrument'

export interface IBasicSynthesizerOptions extends IInstrumentOptions {
	oscillatorType: ShamuOscillatorType
}

// TODO Make into a BasicSynthesizerAudioNode?
export class BasicSynthesizer extends Instrument<SynthVoices, SynthVoice> {
	private readonly _voices: SynthVoices

	constructor(options: IBasicSynthesizerOptions) {
		super(options, 1)

		this._voices = new SynthVoices(options.voiceCount, this._audioContext, this._panNode, options.oscillatorType)
	}

	public setOscillatorType = (type: ShamuOscillatorType) => {
		this._voices.setOscillatorType(type)
	}

	public dispose = () => {
		this._voices.dispose()

		this._dispose()
	}

	protected _getVoices = () => this._voices
}

class SynthVoices extends Voices<SynthVoice> {
	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		super()

		for (let i = 0; i < voiceCount; i++) {
			this._inactiveVoices.push(new SynthVoice(audioContext, destination, oscType))
		}
	}

	public setOscillatorType(type: ShamuOscillatorType) {
		this._activeVoices
			.concat(this._releasingVoices)
			.concat(this._inactiveVoices)
			.forEach(x => x.setOscillatorType(type))
	}
}

class SynthVoice extends Voice {
	private _oscillator: OscillatorNode
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _whiteNoise: AudioBufferSourceNode
	private readonly _noiseBuffer: AudioBuffer

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		super(audioContext, destination)

		this._oscillatorType = oscType
		this._nextOscillatorType = oscType
		this._oscillator = this._audioContext.createOscillator()
		this._whiteNoise = this._audioContext.createBufferSource()

		this._noiseBuffer = this._generateNoiseBuffer()

		this._buildChain()
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSynthNote(note)

		this._afterPlayNote(note)
	}

	public setOscillatorType = (newOscType: ShamuOscillatorType) => {
		this._nextOscillatorType = newOscType

		if (this._status === VoiceStatus.playing) {
			this._refreshOscillatorType()
		}
	}

	public dispose = () => {
		this._deleteChain()
		this._dispose()
	}

	private readonly _playSynthNote = (note: number) => {
		this._oscillator.frequency.value = midiNoteToFrequency(note)
		this._refreshOscillatorType()
	}

	private readonly _refreshOscillatorType = () => {
		if (this._oscillatorType !== this._nextOscillatorType) {
			const oldOscType = this._oscillatorType
			this._oscillatorType = this._nextOscillatorType

			if (this._oscillatorType in BuiltInOscillatorType && oldOscType in BuiltInOscillatorType) {
				this._oscillator.type = this._oscillatorType as OscillatorType
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
		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.start()
		this._whiteNoise = this._audioContext.createBufferSource()
		this._whiteNoise.start()

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
		this._whiteNoise.buffer = this._noiseBuffer
		this._whiteNoise.loop = true

		return this._whiteNoise
	}

	private _buildNormalChain(): AudioNode {
		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(this.playingNote), this._audioContext.currentTime)

		return this._oscillator
	}

	private _deleteChain() {
		this._oscillator.stop()
		this._oscillator.disconnect()
		delete this._oscillator
		this._whiteNoise.stop()
		this._whiteNoise.disconnect()
		delete this._whiteNoise
	}
}
