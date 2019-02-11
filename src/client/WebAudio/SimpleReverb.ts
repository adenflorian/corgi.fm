import Reverb, {ReverbNode} from 'soundbank-reverb'
import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './Instrument'

// TODO Add other Reverb params
//   - [√] time: number
//   - [√] cutoff: AudioParam
//   - [ ] decay: number
//   - [ ] reverse: boolean
//   - [ ] wet: GainNode
//   - [ ] dry: GainNode
//   - [ ] filterType: BiquadFilterType
export class SimpleReverb extends AudioNodeWrapper {
	private readonly _reverbNode: ReverbNode

	constructor(options: IAudioNodeWrapperOptions) {
		super(options)
		this._reverbNode = Reverb(options.audioContext)
		this._reverbNode.time = 3.5
		this._reverbNode.cutoff.value = 2000
		this._reverbNode.dry.value = 0
		this._reverbNode.wet.value = 1
	}

	public readonly getInputAudioNode = () => this._reverbNode
	public readonly getOutputAudioNode = () => this._reverbNode

	public readonly setTime = (time: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newTime = Math.fround(time)
		if (newTime !== this._reverbNode.time) {
			this._reverbNode.time = newTime
		}
	}

	public readonly setCutoff = (cutoff: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newCutoff = Math.fround(cutoff)
		if (newCutoff !== this._reverbNode.cutoff.value) {
			this._reverbNode.cutoff.value = newCutoff
		}
	}

	public readonly dispose = () => {
		this._reverbNode.disconnect()
	}
}
