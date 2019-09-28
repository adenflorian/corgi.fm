import React, {useContext} from 'react'

const defaultNodeManagerContextValue = Object.freeze({
	subscriberThingy: {
	},
})

export type NodeManagerContextValue = typeof defaultNodeManagerContextValue

export const NodeManagerContext = React.createContext(defaultNodeManagerContextValue)

export function useNodeManagerContext() {
	return useContext(NodeManagerContext)
}

export function makeContext() {
	return {
		subscriberThingy: {
		},
	}
}

export class NodeManagerContextClass {
}
