import {LabAudioNode, LabAudioNodeArgs} from './Lab'
import {KelpieConvolutionReverb} from './KelpieConvolutionReverb'

export class LabConvolutionReverbNode extends LabAudioNode<KelpieConvolutionReverb> {
	public readonly name = 'LabConvolutionReverbNode'
	private _time = 0
	public set time(value: number) {
		this.voices.forEach(voice => voice.time = value)
		this._time = value
	}
	private _decay = 0
	public set decay(value: number) {
		this.voices.forEach(voice => voice.decay = value)
		this._decay = value
	}
	private _reverse = false
	public set reverse(value: boolean) {
		this.voices.forEach(voice => voice.reverse = value)
		this._reverse = value
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		super.init()
	}

	protected readonly _makeVoice = (voiceIndex: number): KelpieConvolutionReverb => {
		const newReverb = new KelpieConvolutionReverb({audioContext: this.audioContext, labNode: this, voiceIndex})
		newReverb.time = this._time
		newReverb.decay = this._decay
		newReverb.reverse = this._reverse
		return newReverb
	}
}