import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'

interface SimpleDelayOptions extends IAudioNodeWrapperOptions {
	time: number
}

export class SimpleDelay extends AudioNodeWrapper {
	private readonly _delayNode: DelayNode
	private readonly _inputGain: GainNode

	constructor(options: SimpleDelayOptions) {
		super(options)
		this._delayNode = options.audioContext.createDelay(5)
		this._delayNode.delayTime.value = options.time

		this._inputGain = options.audioContext.createGain()
		this._inputGain.gain.value = 1

		this._inputGain.connect(this._delayNode)
	}

	public readonly getInputAudioNode = () => this._inputGain
	public readonly getOutputAudioNode = () => this._delayNode

	public readonly setDelayTime = (delayTime: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newDelayTime = Math.fround(delayTime)
		if (newDelayTime !== this._delayNode.delayTime.value) {
			this._delayNode.delayTime.value = newDelayTime
		}
	}

	public readonly dispose = () => {
		this._delayNode.disconnect()
	}
}
