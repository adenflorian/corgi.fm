import {clamp} from '@corgifm/common/common-utils'
import {debounce} from 'lodash'
import * as uuid from 'uuid'
import {logger} from '../../../client-logger'
import {impulseBuilder} from '../../../WebWorkers/webWorkers'
import {KelpieAudioNode, KelpieAudioNodeArgs} from './Lab'

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
		this._buildImpulseDebounced()
	}
	public set decay(value: number) {
		this._decay = clamp(value, KelpieConvolutionReverb.minDecay, KelpieConvolutionReverb.maxDecay)
		this._buildImpulseDebounced()
	}
	public set reverse(value: boolean) {
		this._reverse = value
		this._buildImpulseDebounced()
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._convolver = new ConvolverNode(this._audioContext)

		// TODO Use maybe?
		// this._convolver.normalize

		this._buildImpulseDebounced()
	}

	private _buildImpulseDebounced = debounce(this._buildImpulse, 500, {
		leading: false,
		maxWait: 1000,
		trailing: true,
	})

	private async _buildImpulse() {
		const {sampleRate} = this._audioContext
		const length = sampleRate * this._time
		const channelCount = 2
		const impulseBuffer = this._audioContext.createBuffer(channelCount, length, sampleRate)

		try {
			const result = await impulseBuilder.build({
				id: uuid.v4(),
				sampleRate,
				time: this._time,
				decay: this._decay,
				reverse: this._reverse,
			})

			impulseBuffer.copyToChannel(result.left, 0)
			impulseBuffer.copyToChannel(result.right, 1)
		} catch (error) {
			logger.error('error during impulse building: ', {error})
		}

		this._convolver.buffer = impulseBuffer
	}

	public get input(): AudioNode {return this._convolver}
	public get output(): AudioNode {return this._convolver}
	protected _dispose() {}
}