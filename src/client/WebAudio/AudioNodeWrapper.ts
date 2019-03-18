import {List, Map} from 'immutable'
import {IDisposable} from '../../common/common-types'
import {logger} from '../../common/logger'

export interface IAudioNodeWrapperOptions {
	audioContext: AudioContext
	id: string
}

export abstract class AudioNodeWrapper implements IDisposable {
	public abstract dispose: () => void
	public readonly id: string
	protected abstract getInputAudioNode: () => AudioNode | null
	protected abstract getOutputAudioNode: () => AudioNode | null
	protected readonly _audioContext: AudioContext
	private _connectedTargets = Map<string, AudioNodeWrapper>()

	constructor(options: IAudioNodeWrapperOptions) {
		this.id = options.id
		this._audioContext = options.audioContext
	}

	public readonly getConnectedTargets = () => this._connectedTargets

	public readonly connect = (destination: AudioNodeWrapper, targetId: string) => {
		if (this._connectedTargets.has(targetId)) return

		// TODO Prevent feedback loop

		const outputAudioNode = this.getOutputAudioNode()

		if (!outputAudioNode) return

		const inputAudioNode = destination.getInputAudioNode()

		if (!inputAudioNode) return

		this._connectedTargets = this._connectedTargets.set(targetId, destination)

		if (detectFeedbackLoop(this)) {
			logger.warn('Feedback loop detected, preventing connection')
			return
		}

		outputAudioNode.connect(inputAudioNode)
		// logger.debug('AudioNodeWrapper.connect targetId: ', targetId)
	}

	public readonly disconnect = (targetId: string) => {
		if (this._connectedTargets.count() === 0) return

		const targetToDisconnect = this._connectedTargets.get(targetId)

		if (!targetToDisconnect) return

		this._connectedTargets = this._connectedTargets.delete(targetId)

		const audioNodeToDisconnect = targetToDisconnect.getInputAudioNode()

		if (!audioNodeToDisconnect) return

		const output = this.getOutputAudioNode()

		if (!output) return

		try {
			output.disconnect(audioNodeToDisconnect)
		} catch (e) {
			if (e instanceof Error && e.message.includes('the given destination is not connected')) {
				// Do nothing, this is expected in prevented feedback loop situations
			} else {
				throw new Error(e)
			}
		}
	}

	public readonly disconnectAll = () => {
		if (this._connectedTargets.count() === 0) return

		this._connectedTargets = this._connectedTargets.clear()

		const output = this.getOutputAudioNode()

		if (!output) return

		output.disconnect()
	}
}

function detectFeedbackLoop(nodeWrapper: AudioNodeWrapper, i = 0, nodeIds: List<string> = List<string>()): boolean {
	if (nodeIds.contains(nodeWrapper.id)) return true
	if (i > 500) return true

	// TODO Why is netNodeIds unused?
	const netNodeIds = nodeIds.push(nodeWrapper.id)

	if (nodeWrapper.getConnectedTargets().count() === 0) return false

	return nodeWrapper.getConnectedTargets().some(x => {
		return detectFeedbackLoop(x, i + 1, nodeIds)
	})
}

interface MasterAudioOutputOptions extends IAudioNodeWrapperOptions {
	audioNode: AudioNode
}

export class MasterAudioOutput extends AudioNodeWrapper {
	private readonly _audioNode: AudioNode

	constructor(options: MasterAudioOutputOptions) {
		super(options)
		this._audioNode = options.audioNode
	}

	public readonly getInputAudioNode = () => this._audioNode
	public readonly getOutputAudioNode = () => null
	public readonly dispose = () => undefined
}
