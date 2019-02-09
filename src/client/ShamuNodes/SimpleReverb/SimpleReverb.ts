import Reverb from 'soundbank-reverb'
import {IAudioNodeWrapper} from '../../Instruments/Instrument'

export class SimpleReverb implements IAudioNodeWrapper {
	private readonly _reverbNode: Reverb
	private _connectedTargetId: string = '-1'

	constructor(context: AudioContext) {
		this._reverbNode = Reverb(context)
		this._reverbNode.time = 3.5
		this._reverbNode.cutoff.value = 2000
	}

	public getInputAudioNode = () => this._reverbNode
	public getOutputAudioNode = () => this._reverbNode

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
