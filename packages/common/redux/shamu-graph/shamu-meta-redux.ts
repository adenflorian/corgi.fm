import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, Id} from '../../common-types'
import {IClientRoomState} from '../common-redux-types'

export const SET_SELECTED_NODE = 'SET_SELECTED_NODE'
export const CLEAR_SELECTED_NODE = 'CLEAR_SELECTED_NODE'

export const shamuMetaActions = Object.freeze({
	setSelectedNode: (node: SelectedNode) => ({
		type: SET_SELECTED_NODE as typeof SET_SELECTED_NODE,
		node,
	}),
	clearSelectedNode: () => ({
		type: CLEAR_SELECTED_NODE as typeof CLEAR_SELECTED_NODE,
	}),
})

class ShamuMetaState {
	constructor(
		public readonly selectedNode?: SelectedNode,
	) {}
}

export class SelectedNode {
	constructor(
		public readonly id: Id,
		public readonly type: ConnectionNodeType,
	) {}
}

export type ShamuMetaAction = ActionType<typeof shamuMetaActions>

export function shamuMetaReducer(state = new ShamuMetaState(), action: ShamuMetaAction): ShamuMetaState {
	switch (action.type) {
		case SET_SELECTED_NODE: return {...state, selectedNode: action.node}
		case CLEAR_SELECTED_NODE: return {...state, selectedNode: undefined}
		default: return state
	}
}

export const selectShamuMetaState = (state: IClientRoomState) => state.positions.meta
