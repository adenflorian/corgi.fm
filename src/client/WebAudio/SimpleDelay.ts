import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'

interface SimpleDelayOptions extends IAudioNodeWrapperOptions {
	time: number
}

export class SimpleDelay extends AudioNodeWrapper {
	private readonly _delayNode: DelayNode
	private readonly _inputGain: GainNode
	private readonly _outputGain: GainNode
	private readonly _preDelayGain: GainNode

	constructor(options: SimpleDelayOptions) {
		super(options)
		this._delayNode = options.audioContext.createDelay(5)
		this._delayNode.delayTime.value = options.time
		// It defaults to "max", which is dynamic, which causes delay audio to
		// cut out sometimes when upstream audio changes. By setting it to
		// "explicit", it's static and won't change unless we change the
		// channelCount.
		this._delayNode.channelCountMode = 'explicit'

		this._inputGain = options.audioContext.createGain()
		this._inputGain.gain.value = 1

		this._preDelayGain = options.audioContext.createGain()
		this._preDelayGain.gain.value = 0.5

		this._outputGain = options.audioContext.createGain()
		this._outputGain.gain.value = 1

		this._specificDisablePassthroughMode()

		this._preDelayGain.connect(this._delayNode)
		this._delayNode.connect(this._outputGain)
		this._delayNode.connect(this._preDelayGain)
	}

	public readonly getInputAudioNode = () => this._inputGain
	public readonly getOutputAudioNode = () => this._outputGain

	protected readonly _specificDisablePassthroughMode = () => {
		// Dry chain
		this._inputGain.connect(this._outputGain)

		// Wet chain
		this._inputGain.connect(this._preDelayGain)
	}

	public readonly setDelayTime = (delayTime: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newDelayTime = Math.fround(delayTime)
		if (newDelayTime !== this._delayNode.delayTime.value) {
			this._delayNode.delayTime.value = newDelayTime
		}
	}

	public readonly dispose = () => {
		this._delayNode.disconnect()
		this._inputGain.disconnect()
		this._outputGain.disconnect()
	}
}
