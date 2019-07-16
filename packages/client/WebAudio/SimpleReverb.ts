import Reverb from 'soundbank-reverb'
import {BuiltInBQFilterType} from '@corgifm/common/OscillatorTypes'
import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'

interface SimpleReverbOptions extends IAudioNodeWrapperOptions {
	dry: number,
	wet: number,
	reverse: boolean,
	decay: number,
	filterType: BuiltInBQFilterType,
}

export class SimpleReverb extends AudioNodeWrapper {
	private readonly _reverbNode: ReturnType<typeof Reverb>
	private readonly _inputGain: GainNode

	constructor(options: SimpleReverbOptions) {
		super(options)
		this._reverbNode = Reverb(options.audioContext)
		this._reverbNode.time = 3.5
		this._reverbNode.cutoff.value = 2000
		this._reverbNode.dry.value = options.dry
		this._reverbNode.wet.value = options.wet
		this._reverbNode.reverse = options.reverse
		this._reverbNode.decay = options.decay
		this._reverbNode.filterType = options.filterType

		this._inputGain = options.audioContext.createGain()
		this._inputGain.gain.value = 1

		this._specificDisablePassthroughMode()
	}

	public readonly getInputAudioNode = () => this._inputGain
	public readonly getOutputAudioNode = () => this._reverbNode

	protected readonly _specificDisablePassthroughMode = () => {
		this._inputGain.connect(this._reverbNode)
	}

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

	public readonly setDry = (dry: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newDry = Math.fround(dry)
		if (newDry !== this._reverbNode.dry.value) {
			this._reverbNode.dry.value = newDry
		}
	}

	public readonly setWet = (wet: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newWet = Math.fround(wet)
		if (newWet !== this._reverbNode.wet.value) {
			this._reverbNode.wet.value = newWet
		}
	}

	public readonly setReverse = (reverse: boolean) => {
		if (reverse !== this._reverbNode.reverse) {
			this._reverbNode.reverse = reverse
		}
	}

	public readonly setDecay = (decay: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newDecay = Math.fround(decay)
		if (newDecay !== this._reverbNode.decay) {
			this._reverbNode.decay = newDecay
		}
	}

	public readonly setFilterType = (filterType: BuiltInBQFilterType) => {
		if (filterType !== this._reverbNode.filterType) {
			this._reverbNode.filterType = filterType
		}
	}

	public readonly dispose = () => {
		this._reverbNode.disconnect()
	}
}
