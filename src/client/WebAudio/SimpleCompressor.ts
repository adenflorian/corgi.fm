import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'

// TODO Add other Compressor params
//   - [√] time: number
//   - [√] cutoff: AudioParam
//   - [ ] decay: number
//   - [ ] reverse: boolean
//   - [ ] wet: GainNode
//   - [ ] dry: GainNode
//   - [ ] filterType: BiquadFilterType
export class SimpleCompressor extends AudioNodeWrapper {
	private readonly _compressorNode: DynamicsCompressorNode
	private readonly _inputGain: GainNode

	constructor(options: IAudioNodeWrapperOptions) {
		super(options)
		this._compressorNode = options.audioContext.createDynamicsCompressor()
		this._compressorNode.threshold.value = -24
		this._compressorNode.knee.value = 30
		this._compressorNode.ratio.value = 12
		this._compressorNode.attack.value = 0.003
		this._compressorNode.release.value = 0.25

		this._inputGain = options.audioContext.createGain()
		this._inputGain.gain.value = 1

		this._specificDisablePassthroughMode()
	}

	public readonly getInputAudioNode = () => this._inputGain
	public readonly getOutputAudioNode = () => this._compressorNode

	protected readonly _specificDisablePassthroughMode = () => {
		this._inputGain.connect(this._compressorNode)
	}

	public readonly setThreshold = (threshold: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newThreshold = Math.fround(threshold)
		if (newThreshold !== this._compressorNode.threshold.value) {
			this._compressorNode.threshold.value = newThreshold
		}
	}

	public readonly setKnee = (knee: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newKnee = Math.fround(knee)
		if (newKnee !== this._compressorNode.knee.value) {
			this._compressorNode.knee.value = newKnee
		}
	}

	public readonly setRatio = (ratio: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newRatio = Math.fround(ratio)
		if (newRatio !== this._compressorNode.ratio.value) {
			this._compressorNode.ratio.value = newRatio
		}
	}

	public readonly setAttack = (attack: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newAttack = Math.fround(attack)
		if (newAttack !== this._compressorNode.attack.value) {
			this._compressorNode.attack.value = newAttack
		}
	}

	public readonly setRelease = (release: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newRelease = Math.fround(release)
		if (newRelease !== this._compressorNode.release.value) {
			this._compressorNode.release.value = newRelease
		}
	}

	public readonly dispose = () => {
		this._compressorNode.disconnect()
	}
}
