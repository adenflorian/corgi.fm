import {ActionType} from 'typesafe-actions'
import {Id} from '../../common-types'
import {IClientRoomState} from '../common-redux-types'

export const SET_SELECTED_NODE_ID = 'SET_SELECTED_NODE_ID'
export const CLEAR_SELECTED_NODE_ID = 'CLEAR_SELECTED_NODE_ID'

export const shamuMetaActions = Object.freeze({
	setSelectedNodeId: (id: Id) => ({
		type: SET_SELECTED_NODE_ID as typeof SET_SELECTED_NODE_ID,
		id,
	}),
	clearSelectedNodeId: () => ({
		type: CLEAR_SELECTED_NODE_ID as typeof CLEAR_SELECTED_NODE_ID,
	}),
})

class ShamuMetaState {
	constructor(
		public readonly selectedNodeId?: Id,
	) {}
}

export type ShamuMetaAction = ActionType<typeof shamuMetaActions>

export function shamuMetaReducer(state = new ShamuMetaState(), action: ShamuMetaAction): ShamuMetaState {
	switch (action.type) {
		case SET_SELECTED_NODE_ID: return {...state, selectedNodeId: action.id}
		case CLEAR_SELECTED_NODE_ID: return {...state, selectedNodeId: undefined}
		default: return state
	}
}

export const selectShamuMetaState = (state: IClientRoomState) => state.positions.meta
