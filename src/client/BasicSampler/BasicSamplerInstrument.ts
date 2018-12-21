import uuid = require('uuid')
import {IInstrument, IInstrumentOptions} from '../Instruments/IInstrument'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../music/music-functions'
import {SamplesManager} from './SamplesManager'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument implements IInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []
	private _voices: SamplerVoices
	private _attackTimeInSeconds: number = 0.01
	private _releaseTimeInSeconds: number = 1

	constructor(options: IBasicSamplerOptions) {
		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0.5

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(options.destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}

		this._voices = new SamplerVoices(20, this._audioContext, this._panNode)
	}

	public setMidiNotes = (midiNotes: number[]) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._voices.releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._voices.playNote(note, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
	}

	public dispose = () => {
		this._panNode.disconnect()
		delete this._panNode
		this._gain.disconnect()
		delete this._gain
		this._lowPassFilter.disconnect()
		delete this._lowPassFilter
		this._voices.dispose()
		delete this._voices
	}
}

class SamplerVoices {
	private _inactiveVoices: SamplerVoice[] = []
	private _activeVoices: SamplerVoice[] = []
	private _releasingVoices: SamplerVoice[] = []

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode) {
		for (let i = 0; i < voiceCount; i++) {
			this._inactiveVoices.push(new SamplerVoice(audioContext, destination))
		}
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		const voice = this._getVoice(note)

		voice.playNote(note, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		const voice = this._activeVoices.find(x => x.playingNote === note)

		if (voice) {
			const releaseId = voice.release(timeToReleaseInSeconds)

			this._activeVoices = this._activeVoices.filter(x => x !== voice)
			this._releasingVoices.push(voice)

			setTimeout(() => {
				const releasingVoice = this._releasingVoices.find(x => x.getReleaseId() === releaseId)
				if (releasingVoice) {
					this._releasingVoices = this._releasingVoices.filter(x => x.getReleaseId() !== releaseId)
					this._inactiveVoices.push(releasingVoice)
				}
			}, timeToReleaseInSeconds * 1000)
		}
	}

	public dispose() {
		this._inactiveVoices
			.concat(this._releasingVoices)
			.concat(this._activeVoices)
			.forEach(x => x.dispose())
	}

	private _getVoice(note: number): SamplerVoice {
		// Look for active voice that is playing same note
		const sameNoteActiveVoice = this._activeVoices.find(x => x.playingNote === note)

		if (sameNoteActiveVoice) {
			this._activeVoices = this._activeVoices.filter(x => x !== sameNoteActiveVoice)
			this._activeVoices.push(sameNoteActiveVoice)
			return sameNoteActiveVoice
		}

		// Look for releasing voice that is playing same note
		const sameNoteReleasingVoice = this._releasingVoices.find(x => x.playingNote === note)

		if (sameNoteReleasingVoice) {
			this._releasingVoices = this._releasingVoices.filter(x => x !== sameNoteReleasingVoice)
			this._activeVoices.push(sameNoteReleasingVoice)
			return sameNoteReleasingVoice
		}

		if (this._inactiveVoices.length > 0) {
			// Try to return inactive voice first
			const voice = this._inactiveVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		} else if (this._releasingVoices.length > 0) {
			// Next try releasing voices
			const voice = this._releasingVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		} else {
			// Lastly use active voices
			const voice = this._activeVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		}
	}
}

class SamplerVoice {
	public playingNote: number = -1
	public playStartTime: number = 0
	private _gain: GainNode
	private _audioContext: AudioContext
	private _destination: AudioNode
	private _releaseId: string = ''
	private _status: VoiceStatus = VoiceStatus.off
	private _audioBufferSource: AudioBufferSourceNode

	constructor(audioContext: AudioContext, destination: AudioNode) {
		this._audioContext = audioContext
		this._destination = destination
		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)

		this._gain.connect(this._destination)

		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.start()
	}

	public getReleaseId = () => this._releaseId

	public playNote(note: number, attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancel()
		// Never go straight to 0 or you'll probably get a click sound
		this._gain.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + 0.001)
		// this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)

		this._audioBufferSource.stop()
		this._audioBufferSource.disconnect()
		delete this._audioBufferSource
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._audioBufferSource.connect(this._gain)
		this._audioBufferSource.start()

		this.playStartTime = this._audioContext.currentTime

		this.playingNote = note
		this._status = VoiceStatus.playing
	}

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public dispose = () => {
		this._audioBufferSource.stop()
		this._audioBufferSource.disconnect()
		delete this._audioBufferSource
		this._gain.disconnect()
		delete this._gain
	}

	private _cancelAndHoldOrJustCancel = () => {
		const gain = this._gain.gain as any
		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		} else {
			gain.cancelScheduledValues(this._audioContext.currentTime)
		}
	}
}

enum VoiceStatus {
	playing,
	releasing,
	off,
}
