import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType} from '../../common-types'
import {IClientRoomState} from '../common-redux-types'

export const shamuMetaActions = {
	setSelectedNode: (node: SelectedNode) => ({
		type: 'SET_SELECTED_NODE',
		node,
	} as const),
	clearSelectedNode: () => ({
		type: 'CLEAR_SELECTED_NODE',
	} as const),
} as const

class ShamuMetaState {
	public constructor(
		public readonly selectedNode?: SelectedNode,
	) {}
}

export class SelectedNode {
	public constructor(
		public readonly id: Id,
		public readonly type: ConnectionNodeType,
	) {}
}

export type ShamuMetaAction = ActionType<typeof shamuMetaActions>

export function shamuMetaReducer(state = new ShamuMetaState(), action: ShamuMetaAction): ShamuMetaState {
	switch (action.type) {
		case 'SET_SELECTED_NODE': return {...state, selectedNode: action.node}
		case 'CLEAR_SELECTED_NODE': return {...state, selectedNode: undefined}
		default: return state
	}
}

export const selectShamuMetaState = (state: IClientRoomState) => state.positions.meta
