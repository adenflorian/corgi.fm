import Reverb from 'soundbank-reverb'
import {IAudioNodeWrapper, IAudioNodeWrapperOptions} from '../../Instruments/Instrument'

export class SimpleReverb implements IAudioNodeWrapper {
	private readonly _reverbNode: Reverb
	private _connectedTargetId: string = '-1'

	constructor(options: IAudioNodeWrapperOptions) {
		this._reverbNode = Reverb(options.audioContext)
		this._reverbNode.time = 3.5
		this._reverbNode.cutoff.value = 2000
	}

	public readonly getInputAudioNode = () => this._reverbNode
	public readonly getOutputAudioNode = () => this._reverbNode

	public readonly setTime = (time: number) => this._reverbNode.time = time

	public readonly setCutoff = (cutoff: number) => this._reverbNode.cutoff.value = cutoff

	public readonly connect = (destination: IAudioNodeWrapper, targetId: string) => {
		this.disconnectAll()
		this.getOutputAudioNode().connect(destination.getInputAudioNode())
		this._connectedTargetId = targetId
	}

	public readonly disconnectAll = () => {
		this.getOutputAudioNode().disconnect()
		this._connectedTargetId = '-1'
	}

	public readonly getConnectedTargetId = () => this._connectedTargetId

	public readonly dispose = () => {
		this._reverbNode.disconnect()
	}
}
