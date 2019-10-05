import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	BROADCASTER_ACTION, SERVER_ACTION, ActiveConnector, InactiveConnector,
	ActiveGhostConnectorSourceOrTarget, GhostConnectorAddingOrMoving,
	ExpConnectionType, IClientRoomState, BroadcastAction, IClientAppState,
} from '..'

import uuid = require('uuid')

export interface ExpDeleteGhostInfo {
	readonly nodeId: Id
	readonly side: ActiveGhostConnectorSourceOrTarget
	readonly portId: Id
}

export const expGhostConnectorActions = {
	create: (newGhostConnection: ExpGhostConnection) => ({
		type: 'EXP_GHOST_CONNECTION_CREATE',
		newGhostConnection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (id: Id, info?: ExpDeleteGhostInfo) => ({
		type: 'EXP_GHOST_CONNECTION_DELETE',
		id,
		info,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	move: (id: Id, x: number, y: number) => ({
		type: 'EXP_GHOST_CONNECTION_MOVE',
		id,
		x,
		y,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export class ExpGhostConnection {
	public static readonly dummy: ExpGhostConnection = {
		activeConnector: {x: 0, y: 0},
		inactiveConnector: {parentNodeId: 'dummy parent node id'},
		activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget.Source,
		ownerId: 'dummy owner id',
		id: 'dummy id',
		port: 'dummyPortId',
		addingOrMoving: GhostConnectorAddingOrMoving.Adding,
		type: 'dummy',
	}

	public readonly id: Id = uuid.v4()

	public constructor(
		public readonly activeConnector: ActiveConnector,
		public readonly inactiveConnector: InactiveConnector,
		public readonly activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget,
		public readonly ownerId: ClientId,
		public readonly addingOrMoving: GhostConnectorAddingOrMoving,
		public readonly port: Id,
		public readonly type: ExpConnectionType,
		public readonly movingConnectionId?: Id,
	) {}
}

export type ExpGhostConnectorAction = ActionType<typeof expGhostConnectorActions>

export type ExpGhostConnections = Map<Id, ExpGhostConnection>

export const expGhostConnectionsReducer = combineReducers({
	all: _allExpGhostConnectionsReducer,
	localActiveId: _localActiveIdReducer,
})

function _allExpGhostConnectionsReducer(
	state: ExpGhostConnections | undefined = Map<Id, ExpGhostConnection>(),
	action: ExpGhostConnectorAction,
): ExpGhostConnections {
	switch (action.type) {
		case 'EXP_GHOST_CONNECTION_CREATE': return state.set(action.newGhostConnection.id, action.newGhostConnection)
		case 'EXP_GHOST_CONNECTION_DELETE': return state.delete(action.id)
		case 'EXP_GHOST_CONNECTION_MOVE': return state.update(action.id, x => ({
			...x,
			activeConnector: {
				x: action.x,
				y: action.y,
			},
		}))
		default: return state
	}
}

function _localActiveIdReducer(
	state: Id | null = null,
	action: ExpGhostConnectorAction,
): Id | null {
	switch (action.type) {
		case 'EXP_GHOST_CONNECTION_CREATE': return (action as unknown as BroadcastAction).alreadyBroadcasted
			? state
			: action.newGhostConnection.id
		case 'EXP_GHOST_CONNECTION_DELETE': return (action as unknown as BroadcastAction).alreadyBroadcasted
			? state
			: action.id === state
				? null
				: state
		default: return state
	}
}

export const selectExpGhostConnectionsState = (state: IClientRoomState) => state.expGhostConnections

export const selectExpGhostConnection = (state: IClientRoomState, id: Id): ExpGhostConnection =>
	selectExpGhostConnectionsState(state).all.get(id, ExpGhostConnection.dummy)

export function createLocalActiveExpGhostConnectionSelector() {
	return (state: IClientAppState) => {
		const id = selectExpGhostConnectionsState(state.room).localActiveId
		if (!id) return null
		return selectExpGhostConnection(state.room, id)
	}
}
