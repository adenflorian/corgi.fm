import React, {useContext} from 'react'
import {NodeManager} from './Experimental/NodeManager'

export const SingletonContext = React.createContext<SingletonContextImpl | null>(null)

export class SingletonContextImpl {
	public constructor(
		private audioContext: AudioContext,
		private nodeManager?: NodeManager,
	) {}

	public readonly getNodeManager = () => this.nodeManager
	public readonly setNodeManager = (x?: NodeManager) => this.nodeManager = x
	public readonly getAudioContext = () => this.audioContext
	public readonly setAudioContext = (x: AudioContext) => this.audioContext = x
}

export function useSingletonContext() {
	const context = useContext(SingletonContext)

	if (!context) throw new Error('missing uber context: ' + context)

	return context
}
