import React, {useContext} from 'react'
import {NodeManager} from './Experimental/NodeManager'
import {MidiService} from './ClientServices/MidiService'
import {WebSocketService} from './ClientServices/WebSocketService'

export const SingletonContext = React.createContext<SingletonContextImpl | null>(null)

export class SingletonContextImpl {
	private nodeManager?: NodeManager

	public constructor(
		private readonly audioContext: AudioContext,
		private readonly preMasterLimiter: GainNode,
		private readonly _midiService: MidiService,
		private readonly _webSocketService: WebSocketService,
	) {}

	public readonly getNodeManager = () => this.nodeManager
	public readonly setNodeManager = (x?: NodeManager) => this.nodeManager = x
	public readonly getAudioContext = () => this.audioContext
	public readonly getPreMasterLimiter = () => this.preMasterLimiter
	public get midiService() {return this._midiService}
	public get webSocketService() {return this._webSocketService}
}

export function useSingletonContext() {
	const context = useContext(SingletonContext)

	if (!context) throw new Error('missing uber context: ' + context)

	return context
}
