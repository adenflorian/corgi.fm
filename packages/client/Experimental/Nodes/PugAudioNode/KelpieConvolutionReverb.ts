import {KelpieAudioNode, KelpieAudioNodeArgs} from './Lab'
import {clamp} from '@corgifm/common/common-utils'

export class KelpieConvolutionReverb extends KelpieAudioNode {
	public static readonly minTime = 0.001
	public static readonly maxTime = 32
	public static readonly minDecay = 0
	public static readonly maxDecay = 32
	public readonly name = 'ConvolutionReverbNode'
	private readonly _convolver: ConvolverNode
	private _time = KelpieConvolutionReverb.minTime
	private _decay = KelpieConvolutionReverb.minDecay
	private _reverse = false
	public set time(value: number) {
		this._time = clamp(value, KelpieConvolutionReverb.minTime, KelpieConvolutionReverb.maxTime)
		this._buildImpulse()
	}
	public set decay(value: number) {
		this._decay = clamp(value, KelpieConvolutionReverb.minDecay, KelpieConvolutionReverb.maxDecay)
		this._buildImpulse()
	}
	public set reverse(value: boolean) {
		this._reverse = value
		this._buildImpulse()
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._convolver = new ConvolverNode(this._audioContext)
		// TODO Use maybe?
		// this._convolver.normalize
		this._buildImpulse()
	}

	// TODO Make async or something
	private _buildImpulse() {
		const {sampleRate} = this._audioContext
		const length = sampleRate * this._time
		const channelCount = 2
		const impulseBuffer = this._audioContext.createBuffer(channelCount, length, sampleRate)
		const impulseLeft = impulseBuffer.getChannelData(0)
		const impulseRight = impulseBuffer.getChannelData(1)
		let n: number

		for (let i = 0; i < length; i++) {
			n = this._reverse ? length - 1 : i
			impulseLeft[i] = ((Math.random() * 2) - 1) * Math.pow(1 - (n / length), this._decay)
			impulseRight[i] = ((Math.random() * 2) - 1) * Math.pow(1 - (n / length), this._decay)
		}

		this._convolver.buffer = impulseBuffer
	}

	public get input(): AudioNode {return this._convolver}
	public get output(): AudioNode {return this._convolver}
	protected _dispose() {}
}