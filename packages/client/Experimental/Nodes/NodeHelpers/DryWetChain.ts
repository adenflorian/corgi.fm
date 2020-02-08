import {ExpNodePolyMode} from '@corgifm/common/redux'
import {LabAudioNode, LabGain} from '../PugAudioNode/Lab'

export class DryWetChain {
	public readonly inputGain: LabGain
	public readonly dryGain: LabGain
	public readonly wetGain: LabGain
	public readonly wetPostGain: LabGain
	public readonly outputGain: LabGain

	public constructor(
		private readonly audioContext: AudioContext,
		wetInternalNode: LabAudioNode,
		voiceMode: ExpNodePolyMode,
		wetInternalOutputNode?: LabAudioNode,
	) {
		// Only input gain should have a variable voiceMode
		this.inputGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain-inputGain'})
		this.dryGain = new LabGain({audioContext, voiceMode: 'autoPoly', creatorName: 'DryWetChain-dryGain'})
		this.wetGain = new LabGain({audioContext, voiceMode: 'autoPoly', creatorName: 'DryWetChain-wetGain'})
		this.wetPostGain = new LabGain({audioContext, voiceMode: 'autoPoly', creatorName: 'DryWetChain-wetPostGain'})
		this.outputGain = new LabGain({audioContext, voiceMode: 'autoPoly', creatorName: 'DryWetChain-outputGain'})

		this.inputGain
			.connect(this.dryGain)
			.connect(this.outputGain)
		this.inputGain
			.connect(this.wetGain)
			.connect(wetInternalNode);
		(wetInternalOutputNode || wetInternalNode)
			.connect(this.wetPostGain)
			.connect(this.outputGain)

		
		this.inputGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
		this.dryGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, this.audioContext.currentTime)
		this.wetGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
		this.wetPostGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
		this.outputGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
	}

	public setAutoPoly(autoPoly: ExpNodePolyMode) {
		this.inputGain.setVoiceCount(autoPoly)
	}

	public wetOnly() {
		this.dryGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, this.audioContext.currentTime)
		this.wetGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
		this.wetPostGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
	}

	public dryOnly() {
		this.dryGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this.audioContext.currentTime)
		this.wetGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, this.audioContext.currentTime)
		this.wetPostGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, this.audioContext.currentTime)
	}

	public dispose() {
		this.inputGain.dispose()
		this.dryGain.dispose()
		this.wetGain.dispose()
		this.wetPostGain.dispose()
		this.outputGain.dispose()
	}
}
