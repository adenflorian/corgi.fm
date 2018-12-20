import {IInstrument, IInstrumentOptions} from '../Instruments/IInstrument'
import {SamplesManager} from './SamplesManager'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument implements IInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []
	private _myArrayBuffer: AudioBuffer
	private _audioBufferSource: AudioBufferSourceNode

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

		// Create an empty two second stereo buffer at the
		// sample rate of the AudioContext
		const channels = 2
		const frameCount = this._audioContext.sampleRate * 2.0

		this._myArrayBuffer = this._audioContext.createBuffer(channels, frameCount, this._audioContext.sampleRate)

		this._audioBufferSource = this._audioContext.createBufferSource()
		// set the buffer in the AudioBufferSourceNode
		this._audioBufferSource.buffer = SamplesManager.sampleC4
		// connect the AudioBufferSourceNode to the
		// destination so we can hear the sound
		this._audioBufferSource.connect(this._panNode)
		// start the source playing
		this._audioBufferSource.start()
	}

	public setMidiNotes = (midiNotes: number[]) => undefined

	public dispose = () => undefined
}
