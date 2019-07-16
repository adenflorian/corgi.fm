import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {ClientId} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from './index'

import uuid = require('uuid')

export const GHOST_CONNECTION_CREATE = 'GHOST_CONNECTION_CREATE'
export const GHOST_CONNECTION_DELETE = 'GHOST_CONNECTION_DELETE'
export const GHOST_CONNECTION_MOVE = 'GHOST_CONNECTION_MOVE'

export const ghostConnectorActions = Object.freeze({
	create: (newGhostConnection: GhostConnection) => ({
		type: GHOST_CONNECTION_CREATE as typeof GHOST_CONNECTION_CREATE,
		newGhostConnection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	delete: (id: GhostConnectionId) => ({
		type: GHOST_CONNECTION_DELETE as typeof GHOST_CONNECTION_DELETE,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	move: (id: GhostConnectionId, x: number, y: number) => ({
		type: GHOST_CONNECTION_MOVE as typeof GHOST_CONNECTION_MOVE,
		id,
		x,
		y,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export interface GhostConnectionsState {
	all: Map<GhostConnectionId, GhostConnection>
}

export enum ActiveGhostConnectorSourceOrTarget {
	Source = 'Source',
	Target = 'Target',
}

export enum GhostConnectorAddingOrMoving {
	Adding = 'Adding',
	Moving = 'Moving',
}

export class GhostConnection {
	public static readonly dummy: GhostConnection = {
		activeConnector: {x: 0, y: 0},
		inactiveConnector: {parentNodeId: 'dummy parent node id'},
		activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget.Source,
		ownerId: 'dummy owner id',
		id: 'dummy id',
		port: 0,
		addingOrMoving: GhostConnectorAddingOrMoving.Adding,
	}

	public readonly id: GhostConnectionId = uuid.v4()

	constructor(
		public readonly activeConnector: ActiveConnector,
		public readonly inactiveConnector: InactiveConnector,
		public readonly activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget,
		public readonly ownerId: ClientId,
		public readonly addingOrMoving: GhostConnectorAddingOrMoving,
		public readonly port: number,
		public readonly movingConnectionId?: string,
	) {}
}

export type GhostConnectionId = string

export interface ActiveConnector {
	x: number
	y: number
}

export interface InactiveConnector {
	parentNodeId: string
}

export type GhostConnectorAction = ActionType<typeof ghostConnectorActions>

export type GhostConnections = Map<GhostConnectionId, GhostConnection>

export const ghostConnectionsReducer: Reducer<GhostConnectionsState> = combineReducers({
	all: _allGhostConnectionsReducer,
})

function _allGhostConnectionsReducer(
	state: GhostConnections | undefined = Map<GhostConnectionId, GhostConnection>(),
	action: GhostConnectorAction,
): GhostConnections {
	switch (action.type) {
		case GHOST_CONNECTION_CREATE: return state.set(action.newGhostConnection.id, action.newGhostConnection)
		case GHOST_CONNECTION_DELETE: return state.delete(action.id)
		case GHOST_CONNECTION_MOVE: return state.update(action.id, x => ({
			...x,
			activeConnector: {
				x: action.x,
				y: action.y,
			},
		}))
		default: return state
	}
}

export const selectGhostConnectionsState = (state: IClientRoomState) => state.ghostConnections

export const selectGhostConnection = (state: IClientRoomState, id: GhostConnectionId): GhostConnection =>
	selectGhostConnectionsState(state).all.get(id, GhostConnection.dummy)
