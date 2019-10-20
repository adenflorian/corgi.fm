export class DryWetChain {
	public readonly inputGain: GainNode
	public readonly dryGain: GainNode
	public readonly wetGain: GainNode
	public readonly outputGain: GainNode

	public constructor(
		audioContext: AudioContext,
		wetInternalNode: AudioNode,
		wetInternalOutputNode?: AudioNode,
	) {
		this.inputGain = audioContext.createGain()
		this.dryGain = audioContext.createGain()
		this.wetGain = audioContext.createGain()
		this.outputGain = audioContext.createGain()

		this.inputGain
			.connect(this.dryGain)
			.connect(this.outputGain)
		this.inputGain
			.connect(this.wetGain)
			.connect(wetInternalNode);
		(wetInternalOutputNode || wetInternalNode)
			.connect(this.outputGain)

		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public wetOnly() {
		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public dryOnly() {
		this.dryGain.gain.value = 1
		this.wetGain.gain.value = 0
	}

	public dispose() {
		this.inputGain.disconnect()
		this.dryGain.disconnect()
		this.wetGain.disconnect()
		this.outputGain.disconnect()
	}
}
