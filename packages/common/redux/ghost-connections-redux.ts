import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientRoomState, BroadcastAction, IClientAppState} from './common-redux-types'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '.'

import uuid = require('uuid')

export interface DeleteGhostInfo {
	readonly nodeId: Id
	readonly side: ActiveGhostConnectorSourceOrTarget
	readonly portId: number
}

export const ghostConnectorActions = {
	create: (newGhostConnection: GhostConnection) => ({
		type: 'GHOST_CONNECTION_CREATE',
		newGhostConnection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (id: Id, info?: DeleteGhostInfo) => ({
		type: 'GHOST_CONNECTION_DELETE',
		id,
		info,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	move: (id: Id, x: number, y: number) => ({
		type: 'GHOST_CONNECTION_MOVE',
		id,
		x,
		y,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

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

	public readonly id: Id = uuid.v4()

	public constructor(
		public readonly activeConnector: ActiveConnector,
		public readonly inactiveConnector: InactiveConnector,
		public readonly activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget,
		public readonly ownerId: ClientId,
		public readonly addingOrMoving: GhostConnectorAddingOrMoving,
		public readonly port: number,
		public readonly movingConnectionId?: Id,
	) {}
}

export interface ActiveConnector {
	x: number
	y: number
}

export interface InactiveConnector {
	parentNodeId: Id
}

export type GhostConnectorAction = ActionType<typeof ghostConnectorActions>

export type GhostConnections = Map<Id, GhostConnection>

export const ghostConnectionsReducer = combineReducers({
	all: _allGhostConnectionsReducer,
	localActiveId: _localActiveIdReducer,
})

function _allGhostConnectionsReducer(
	state: GhostConnections | undefined = Map<Id, GhostConnection>(),
	action: GhostConnectorAction,
): GhostConnections {
	switch (action.type) {
		case 'GHOST_CONNECTION_CREATE': return state.set(action.newGhostConnection.id, action.newGhostConnection)
		case 'GHOST_CONNECTION_DELETE': return state.delete(action.id)
		case 'GHOST_CONNECTION_MOVE': return state.update(action.id, x => ({
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
	action: GhostConnectorAction,
): Id | null {
	switch (action.type) {
		case 'GHOST_CONNECTION_CREATE': return (action as unknown as BroadcastAction).alreadyBroadcasted
			? state
			: action.newGhostConnection.id
		case 'GHOST_CONNECTION_DELETE': return (action as unknown as BroadcastAction).alreadyBroadcasted
			? state
			: action.id === state
				? null
				: state
		default: return state
	}
}

export const selectGhostConnectionsState = (state: IClientRoomState) => state.ghostConnections

export const selectGhostConnection = (state: IClientRoomState, id: Id): GhostConnection =>
	selectGhostConnectionsState(state).all.get(id, GhostConnection.dummy)

export function createLocalActiveGhostConnectionSelector() {
	return (state: IClientAppState) => {
		const id = state.room.ghostConnections.localActiveId
		if (!id) return null
		return selectGhostConnection(state.room, id)
	}
}
