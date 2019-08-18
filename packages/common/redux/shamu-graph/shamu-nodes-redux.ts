import {combineReducers} from 'redux'
import {ConnectionNodeType} from '../../common-types'
import {groupSequencersReducer} from '../group-sequencers-redux'
import {simpleDelaysReducer} from '../simple-delay-redux'
import {
	basicSamplersReducer, basicSynthesizersReducer, gridSequencersReducer,
	IClientRoomState, IMultiState, infiniteSequencersReducer,
	simpleCompressorsReducer, simpleReverbsReducer, virtualKeyboardsReducer,
	betterSequencersReducer,
} from '..'

// export const shamuNodesActions = {
// 	add: (newNode: NodeState) => ({
// 		type: 'ADD_SHAMU_NODE',
// 		newNode,
// 	} as const),
// 	delete: (ids: string[]) => ({
// 		type: 'DELETE_SHAMU_NODES',
// 		ids,
// 	} as const),
// 	update: (nodes: ShamuNodesState) => ({
// 		type: 'UPDATE_SHAMU_NODES',
// 		nodes,
// 	} as const),
// 	setAll: (nodes: ShamuNodesState) => ({
// 		type: 'SET_ALL_SHAMU_NODES',
// 		nodes,
// 	} as const),
// } as const

// export type ShamuNodesState = ReturnType<typeof makeShamuNodesState>

// export function makeShamuNodesState() {
// 	return Map<string, NodeState>()
// }

// export interface NodeState {
// 	id: Id
// 	type: ConnectionNodeType
// 	// position: IPosition
// 	ownerId: Id
// 	specialState: NodeSpecialState
// }

// export function makeNodeState({ownerId, type, specialState}: Pick<NodeState, 'ownerId' | 'type' | 'specialState'>) {
// 	const id = uuid.v4()

// 	return {
// 		id,
// 		ownerId,
// 		type,
// 		specialState,
// 		// position: makePosition({
// 		// 	id, // TODO Is this still needed?
// 		// 	targetType: type, // TODO Is this still needed?
// 		// }),
// 	} as const
// }

// export type NodeSpecialState2 = BasicSynthesizerState | BasicSamplerState |
// 	VirtualKeyboardState | GridSequencerState | InfiniteSequencerState

export interface NodeSpecialState {
	readonly id: Id
}

// export type ShamuNodesAction = ActionType<typeof shamuNodesActions> | UpdatePositionsAction

export const nodesReducer = combineReducers({
	basicSynthesizers: basicSynthesizersReducer,
	basicSamplers: basicSamplersReducer,
	betterSequencers: betterSequencersReducer,
	gridSequencers: gridSequencersReducer,
	infiniteSequencers: infiniteSequencersReducer,
	groupSequencers: groupSequencersReducer,
	simpleReverbs: simpleReverbsReducer,
	simpleCompressors: simpleCompressorsReducer,
	simpleDelays: simpleDelaysReducer,
	virtualKeyboards: virtualKeyboardsReducer,
} as const)

// export function nodesReducer(state = makeShamuNodesState(), action: ShamuNodesAction) {
// 	switch (action.type) {
// 		case 'ADD_SHAMU_NODE': return state.set(action.newNode.id, action.newNode)
// 		case 'DELETE_SHAMU_NODES': return state.deleteAll(action.ids)
// 		case 'UPDATE_SHAMU_NODES': return state.merge(action.nodes)
// 		case 'SET_ALL_SHAMU_NODES': return state.clear().merge(action.nodes)
// 		default: return state
// 	}
// }

// Modeled after redux combineReducers
// function specialStateReducer(state: ShamuNodesState, action: UpdatePositionsAction): ShamuNodesState {
// 	let newStates = makeShamuNodesState()

// 	let hasChanged = false

// 	state.forEach(x => {
// 		const newState = nodeReducer(x, action)

// 		newStates = newStates.set(x.id, newState)

// 		hasChanged = hasChanged || newState !== x
// 	})

// 	return hasChanged ? newStates : state
// }

// const dummyNodeState = makeNodeState({
// 	ownerId: '-1',
// 	type: ConnectionNodeType.dummy,
// 	specialState: {id: '-1'},
// })

// function nodeReducer(state: NodeState, action: UpdatePositionsAction) {
// 	switch (action.type) {
// 		case UPDATE_POSITIONS: {
// 			return {
// 				...state,
// 				position: {
// 					...state.position,
// 					...(action.positions.get(state.id) || {}),
// 				},
// 			}
// 		}
// 		default: return state
// 	}
// }

// function specialStateReducer(state: ShamuNodesState, action: Action) {
// 	return combineReducers(state.map(x => getReducerByType(x.type)).toObject())(state, action)
// }

// function getReducerByType(type: ConnectionNodeType) {
// 	return (state: NodeSpecialState = dummyNodeSpecialState, action: Action) => state
// }

// const dummyNodeSpecialState: NodeSpecialState = GridSequencerState.dummy

export const selectNodeIdsOwnedByClient = (state: IClientRoomState, clientId: ClientId) => {
	const nodes = state.shamuGraph.nodes as unknown as {[key: string]: IMultiState}

	const ids: {id: Id, type: ConnectionNodeType}[] = []

	Object.keys(nodes).forEach(nodeKey => {
		const things = nodes[nodeKey].things
		Object.keys(things).forEach(thingKey => {
			const thing = things[thingKey]
			if (thing.ownerId === clientId) ids.push({id: thing.id, type: thing.type})
		})
	})

	return ids
}
