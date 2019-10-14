import {simpleGlobalClientState} from '../SimpleGlobalClientState'

export class CorgiAnalyserSPNode {
	public get input() {return this._scriptProcessorNode as AudioNode}
	private readonly _scriptProcessorNode: ScriptProcessorNode
	private _updateRequested = false
	private _lastUpdatedValue = 0

	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _onUpdatedValue: (newValue: number) => void,
	) {
		this._scriptProcessorNode = _audioContext.createScriptProcessor(256, 1, 1)
		this._scriptProcessorNode.addEventListener('audioprocess', this._onAudioProcess)
		this._scriptProcessorNode.connect(simpleGlobalClientState.getAnalyserDumpNode(_audioContext))
	}

	public requestUpdate() {
		this._updateRequested = true
	}

	private readonly _onAudioProcess = (audioProcessingEvent: AudioProcessingEvent) => {
		if (!this._updateRequested) return

		const value = audioProcessingEvent.inputBuffer.getChannelData(0)[0]

		if (!Number.isNaN(value) && value !== this._lastUpdatedValue) {
			this._updateRequested = false
			this._lastUpdatedValue = value
			this._onUpdatedValue(value)
		}
	}

	public dispose() {
		this._scriptProcessorNode.removeEventListener('audioprocess', this._onAudioProcess)
		this._scriptProcessorNode.disconnect()
	}
}
