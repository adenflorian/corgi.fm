import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {logger} from '../client-logger'
import {LabAudioNode, KelpieAudioNode} from './Nodes/PugAudioNode/Lab'

export class LabCorgiAnalyserSPNode extends LabAudioNode<KelpieCorgiAnalyserSPNode> {
	public _makeVoice() {
		const newThing = new KelpieCorgiAnalyserSPNode(this._audioContext, this._onUpdatedValue, this._ignoreRepeats)
		return newThing
	}

	public constructor(
		__audioContext: AudioContext,
		private readonly _onUpdatedValue: (newValue: number) => void,
		public readonly _ignoreRepeats = true,
	) {
		super({audioContext: __audioContext, voiceMode: 'autoPoly'})
		this.voices.push(new KelpieCorgiAnalyserSPNode(this._audioContext, _onUpdatedValue, this._ignoreRepeats))
	}

	public requestUpdate() {
		this.voices[0].requestUpdate()
	}

	public dispose() {}
}


export class KelpieCorgiAnalyserSPNode extends KelpieAudioNode {
	public get input() {return this._scriptProcessorNode as AudioNode}
	public get output(): AudioNode {
		throw new Error('Method not implemented.');
	}
	private readonly _scriptProcessorNode: ScriptProcessorNode
	private _updateRequested = false
	private _lastUpdatedValue = 0

	public constructor(
		__audioContext: AudioContext,
		private readonly _onUpdatedValue: (newValue: number) => void,
		public readonly _ignoreRepeats = true,
	) {
		super({audioContext: __audioContext})
		this._scriptProcessorNode = this._audioContext.createScriptProcessor(256, 1, 1)
		this._scriptProcessorNode.addEventListener('audioprocess', this._onAudioProcess)
		try {
			this._scriptProcessorNode.connect(simpleGlobalClientState.getAnalyserDumpNode(this._audioContext))
		} catch (error1) {
			try {
				logger.warn('ha ha ha uh oh:', {error1})
				simpleGlobalClientState.resetAnalyserDumpNode(this._audioContext)
				this._scriptProcessorNode.connect(simpleGlobalClientState.getAnalyserDumpNode(this._audioContext))
			} catch (error2) {
				logger.error('failed to connect to analyser node:', {error2})
			}
		}
	}

	public requestUpdate() {
		this._updateRequested = true
	}

	private readonly _onAudioProcess = (audioProcessingEvent: AudioProcessingEvent) => {
		if (!this._updateRequested) return

		const value = audioProcessingEvent.inputBuffer.getChannelData(0)[0]

		if (!Number.isNaN(value) && (this._ignoreRepeats || value !== this._lastUpdatedValue)) {
			this._updateRequested = false
			this._lastUpdatedValue = value
			this._onUpdatedValue(value)
		}
	}

	protected _dispose(): void {
		this._scriptProcessorNode.removeEventListener('audioprocess', this._onAudioProcess)
		this._scriptProcessorNode.disconnect()
	}
}
