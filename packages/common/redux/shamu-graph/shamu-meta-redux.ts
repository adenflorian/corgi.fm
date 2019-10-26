import {ActionType} from 'typesafe-actions'
import {Set} from 'immutable'
import {IClientRoomState} from '../common-redux-types'

export const shamuMetaActions = {
	setSelectedNodes: (nodeIds: Set<Id>) => ({
		type: 'SET_SELECTED_NODES',
		nodeIds,
	} as const),
	clearSelectedNodes: () => ({
		type: 'CLEAR_SELECTED_NODES',
	} as const),
} as const

class ShamuMetaState {
	public constructor(
		public readonly selectedNodes = Set<Id>(),
	) {}
}

export type ShamuMetaAction = ActionType<typeof shamuMetaActions>

export function shamuMetaReducer(state = new ShamuMetaState(), action: ShamuMetaAction): ShamuMetaState {
	switch (action.type) {
		case 'SET_SELECTED_NODES': return {...state, selectedNodes: action.nodeIds}
		case 'CLEAR_SELECTED_NODES': return {...state, selectedNodes: state.selectedNodes.clear()}
		default: return state
	}
}

export const selectShamuMetaState = (state: IClientRoomState) => state.positions.meta
