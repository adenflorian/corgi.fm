import {IInstrument, IInstrumentOptions} from '../Instruments/IInstrument'
import {SamplesManager} from './SamplesManager'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument implements IInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []

	constructor(options: IBasicSamplerOptions) {
		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 500

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0.5

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(options.destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}
	}

	public setMidiNotes = (midiNotes: number[]) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		// offNotes.forEach(note => {
		// })

		newNotes.forEach(note => {
			this._playSample()
		})

		this._previousNotes = midiNotes
	}

	public dispose = () => undefined

	private _playSample = () => {
		const audioBufferSource = this._audioContext.createBufferSource()

		// set the buffer in the AudioBufferSourceNode
		audioBufferSource.buffer = SamplesManager.sampleC4

		// connect the AudioBufferSourceNode to the
		// destination so we can hear the sound
		audioBufferSource.connect(this._panNode)

		// start the source playing
		audioBufferSource.start()

		setTimeout(() => {
			audioBufferSource.stop()
			audioBufferSource.disconnect()
		}, 15000)
	}
}
