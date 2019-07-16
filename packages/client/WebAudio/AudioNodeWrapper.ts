import {List, Map} from 'immutable'
import {IDisposable} from '@corgifm/common/common-types'
import {logger} from '@corgifm/common/logger'

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
	private _enabled: boolean = true
	private _passthroughModeEnabled: boolean = true

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

	public readonly setEnabled = (enabled: boolean) => {
		if (enabled === this._enabled) return

		this._enabled = enabled

		if (this._enabled) {
			this._enable()
		} else {
			this._disable()
		}
	}

	public readonly setPassthroughMode = (passthroughModeEnabled: boolean) => {
		if (passthroughModeEnabled === this._passthroughModeEnabled) return

		this._passthroughModeEnabled = passthroughModeEnabled

		return this._passthroughModeEnabled
			? this._enablePassthroughMode()
			: this._disablePassThroughMode()
	}

	private readonly _enable = () => {
		const outputAudioNode = this.getOutputAudioNode()

		if (!outputAudioNode) return

		this._connectedTargets.forEach(destination => {
			const destinationInput = destination.getInputAudioNode()

			if (!destinationInput) return

			if (detectFeedbackLoop(this)) {
				logger.warn('Feedback loop detected, preventing connection')
				return
			}

			outputAudioNode.connect(destinationInput)
		})
	}

	private readonly _disable = () => {
		if (this._connectedTargets.count() === 0) return

		const output = this.getOutputAudioNode()

		if (!output) return

		output.disconnect()
	}

	private readonly _enablePassthroughMode = () => {
		// disconnect output from destinations
		if (this._connectedTargets.count() === 0) return

		const output = this.getOutputAudioNode()

		if (!output) return

		output.disconnect()

		// connect input to destinations

		const input = this.getInputAudioNode()

		if (!input) return

		// might as well disconnect input from output
		input.disconnect()

		this._connectedTargets.forEach(destination => {
			const destinationInput = destination.getInputAudioNode()

			if (!destinationInput) return

			if (detectFeedbackLoop(this)) {
				logger.warn('Feedback loop detected, preventing connection')
				return
			}

			input.connect(destinationInput)
		})
	}

	// TODO For future effect nodes, we weill have to call something on them
	// to have them connect their input to their output again
	private readonly _disablePassThroughMode = () => {
		// disconnect input from destinations
		const input = this.getInputAudioNode()

		if (!input) return

		input.disconnect()

		// connect input to output
		const output = this.getOutputAudioNode()

		if (!output) return

		this._specificDisablePassthroughMode()

		this._connectedTargets.forEach(destination => {
			const destinationInput = destination.getInputAudioNode()

			if (!destinationInput) return

			if (detectFeedbackLoop(this)) {
				logger.warn('Feedback loop detected, preventing connection')
				return
			}

			output.connect(destinationInput)
		})
	}

	protected readonly _specificDisablePassthroughMode = () => {
		const input = this.getInputAudioNode()

		if (!input) return

		const output = this.getOutputAudioNode()

		if (!output) return

		input.connect(output)
	}

	// eslint-disable-next-line no-empty-function
	public readonly syncOscillatorStartTimes = (startTime: number, bpm: number) => {}
}

function detectFeedbackLoop(nodeWrapper: AudioNodeWrapper, i = 0, nodeIds: List<string> = List<string>()): boolean {
	if (nodeIds.contains(nodeWrapper.id)) return true
	if (i > 500) return true

	// TODO Why is netNodeIds unused?
	// const netNodeIds = nodeIds.push(nodeWrapper.id)

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
