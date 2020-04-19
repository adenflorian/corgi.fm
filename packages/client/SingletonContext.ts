import React, {useContext} from 'react'
import {Store} from 'redux'
import {IClientAppState} from '@corgifm/common/redux'
import {NodeManager} from './Experimental/NodeManager'
import {MidiService} from './ClientServices/MidiService'
import {WebSocketService} from './ClientServices/WebSocketService'
import {SamplesManager} from './WebAudio'

export const SingletonContext = React.createContext<SingletonContextImpl | null>(null)

export class SingletonContextImpl {
	private nodeManager?: NodeManager
	private _store?: Store<IClientAppState>
	private _masterLimiter?: DynamicsCompressorNode

	public constructor(
		private readonly audioContext: AudioContext,
		private readonly preMasterLimiter: GainNode,
		private readonly _midiService: MidiService,
		private readonly _webSocketService: WebSocketService,
		private readonly _samplesManager: SamplesManager,
	) {}

	public readonly getNodeManager = () => this.nodeManager
	public readonly setNodeManager = (x?: NodeManager) => this.nodeManager = x
	public readonly getStore = () => this._store
	public readonly setStore = (x?: Store<IClientAppState>) => this._store = x
	public readonly getMasterLimiter = () => this._masterLimiter
	public readonly setMasterLimiter = (x?: DynamicsCompressorNode) => this._masterLimiter = x
	public readonly getAudioContext = () => this.audioContext
	public readonly getPreMasterLimiter = () => this.preMasterLimiter
	public get midiService() {return this._midiService}
	public get webSocketService() {return this._webSocketService}
	public get samplesManager() {return this._samplesManager}
}

export function useSingletonContext() {
	const context = useContext(SingletonContext)

	if (!context) throw new Error('missing uber context: ' + context)

	return context
}
