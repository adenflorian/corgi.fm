import React, {useContext} from 'react'
import {NodeManager} from './Experimental/NodeManager'

export const SingletonContext = React.createContext<SingletonContextImpl | null>(null)

export class SingletonContextImpl {
	private nodeManager?: NodeManager

	public constructor(
		private audioContext: AudioContext,
		private preMasterLimiter: GainNode,
	) {}

	public readonly getNodeManager = () => this.nodeManager
	public readonly setNodeManager = (x?: NodeManager) => this.nodeManager = x
	public readonly getAudioContext = () => this.audioContext
	public readonly getPreMasterLimiter = () => this.preMasterLimiter
}

export function useSingletonContext() {
	const context = useContext(SingletonContext)

	if (!context) throw new Error('missing uber context: ' + context)

	return context
}
