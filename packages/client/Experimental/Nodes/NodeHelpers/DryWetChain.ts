import {PugPolyAudioNode, PugPolyGainNode} from '../PugAudioNode/PugAudioNode'

export class DryWetChain {
	public readonly inputGain: PugPolyGainNode
	public readonly dryGain: PugPolyGainNode
	public readonly wetGain: PugPolyGainNode
	public readonly wetPostGain: PugPolyGainNode
	public readonly outputGain: PugPolyGainNode

	public constructor(
		audioContext: AudioContext,
		wetInternalNode: PugPolyAudioNode,
		wetInternalOutputNode?: PugPolyAudioNode,
	) {
		this.inputGain = new PugPolyGainNode({audioContext})
		this.dryGain = new PugPolyGainNode({audioContext})
		this.wetGain = new PugPolyGainNode({audioContext})
		this.wetPostGain = new PugPolyGainNode({audioContext})
		this.outputGain = new PugPolyGainNode({audioContext})

		this.inputGain
			.connect(this.dryGain)
			.connect(this.outputGain)
		this.inputGain
			.connect(this.wetGain)
			.connect(wetInternalNode);
		(wetInternalOutputNode || wetInternalNode)
			.connect(this.wetPostGain)
			.connect(this.outputGain)

		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public wetOnly() {
		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
		this.wetPostGain.gain.value = 1
	}

	public dryOnly() {
		this.dryGain.gain.value = 1
		this.wetGain.gain.value = 0
		this.wetPostGain.gain.value = 0
	}

	public dispose() {
		this.inputGain.dispose()
		this.dryGain.dispose()
		this.wetGain.dispose()
		this.wetPostGain.dispose()
		this.outputGain.dispose()
	}
}
