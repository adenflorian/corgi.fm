import {List, Map, Record, Set} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {ConnectionNodeType} from '../common-types'
import {IMidiNotes} from '../MidiNote'
import {CssColor, mixColors} from '../shamu-color'
import {
	BROADCASTER_ACTION, getConnectionNodeInfo, IClientRoomState,
	selectVirtualKeyboardById, SERVER_ACTION, VirtualKeyboardState,
} from './index'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export const DELETE_CONNECTIONS = 'DELETE_CONNECTIONS'
export const DELETE_ALL_CONNECTIONS = 'DELETE_ALL_CONNECTIONS'
export const UPDATE_CONNECTIONS = 'UPDATE_CONNECTIONS'
export const UPDATE_CONNECTION = 'UPDATE_CONNECTION'

export const connectionsActions = Object.freeze({
	add: (connection: IConnection) => ({
		type: ADD_CONNECTION as typeof ADD_CONNECTION,
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	delete: (connectionIds: List<string>) => ({
		type: DELETE_CONNECTIONS as typeof DELETE_CONNECTIONS,
		connectionIds,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	deleteAll: () => ({
		type: DELETE_ALL_CONNECTIONS as typeof DELETE_ALL_CONNECTIONS,
	}),
	updateAll: (connections: IConnections) => ({
		type: UPDATE_CONNECTIONS as typeof UPDATE_CONNECTIONS,
		connections,
		BROADCASTER_ACTION,
	}),
	update: (id: string, connection: Partial<IConnection>) => ({
		type: UPDATE_CONNECTION as typeof UPDATE_CONNECTION,
		id,
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export interface IConnectionsState {
	connections: IConnections
}

export type IConnections = Map<string, IConnection>

export const Connections = Map

export interface IConnection {
	sourceId: string
	sourceType: ConnectionNodeType
	targetId: string
	targetType: ConnectionNodeType
	id: string
}

export class Connection implements IConnection {
	public static dummy: IConnection = {
		sourceId: '-1',
		sourceType: ConnectionNodeType.dummy,
		targetId: '-1',
		targetType: ConnectionNodeType.dummy,
		id: '-1',
	}

	public readonly id = uuid.v4()

	constructor(
		public sourceId: string,
		public sourceType: ConnectionNodeType,
		public targetId: string,
		public targetType: ConnectionNodeType,
	) {}
}

export type IConnectionAction = ActionType<typeof connectionsActions>

const connectionsSpecificReducer: Reducer<IConnections, IConnectionAction> =
	(connections = Connections(), action) => {
		switch (action.type) {
			case ADD_CONNECTION: return connections.set(action.connection.id, action.connection)
			case DELETE_CONNECTIONS: return connections.deleteAll(action.connectionIds)
			case DELETE_ALL_CONNECTIONS: return connections.clear()
			case UPDATE_CONNECTIONS: return connections.merge(action.connections)
			case UPDATE_CONNECTION: return connections.update(action.id, x => ({...x, ...action.connection}))
			default: return connections
		}
	}

export const connectionsReducer: Reducer<IConnectionsState, any> = combineReducers({
	connections: connectionsSpecificReducer,
})

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectConnection = (state: IClientRoomState, id: string) =>
	selectAllConnections(state).get(id) || Connection.dummy

export const selectSourceByConnectionId = (state: IClientRoomState, id: string): VirtualKeyboardState =>
	selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)

export const selectAllConnectionIds = createSelector(
	selectAllConnections,
	connections => connections.keySeq().toArray(),
)

export const selectSortedConnections = createSelector(
	selectAllConnections,
	connections => connections.sort(sortConnection).toList(),
)

export const selectConnectionsWithSourceOrTargetIds = (state: IClientRoomState, sourceOrTargetIds: string[]) => {
	return selectAllConnections(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export const selectConnectionsWithTargetIds2 = (connections: IConnections, targetIds: string[]) => {
	return connections
		.filter(x => targetIds.includes(x.targetId))
}

export const selectConnectionsWithTargetIds = (state: IClientRoomState, targetIds: string[]) => {
	return selectConnectionsWithTargetIds2(selectAllConnections(state), targetIds)
}

export const selectConnectionsWithSourceIds = (state: IClientRoomState, sourceIds: string[]) => {
	return selectAllConnections(state)
		.filter(x => sourceIds.includes(x.sourceId))
}

export const selectFirstConnectionByTargetId = (state: IClientRoomState, targetId: string) =>
	selectAllConnections(state)
		.find(x => x.targetId === targetId) || Connection.dummy

export const selectFirstConnectionIdByTargetId = (state: IClientRoomState, targetId: string): string => {
	const conn = selectFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

/** For use by a node */
export const selectConnectionSourceColorByTargetId =
	(state: IClientRoomState, targetId: string, processedIds = List<string>()): string => {
		const connections = selectAllConnections(state).filter(x => x.targetId === targetId)

		if (connections.count() === 0) return makeConnectionSourceColorSelector(state, processedIds)(Connection.dummy)

		const colors = connections.map(makeConnectionSourceColorSelector(state, processedIds))

		return mixColors(colors.toList())
	}

/** For use by a connection */
export const selectConnectionSourceColor = (state: IClientRoomState, id: string): string => {
	const connection = selectConnection(state, id)

	return makeConnectionSourceColorSelector(state)(connection)
}

const makeConnectionSourceColorSelector =
	(roomState: IClientRoomState, processedIds = List<string>()) => (connection: IConnection) => {
		// If in a loop
		if (processedIds.contains(connection.id)) return CssColor.subtleGrayBlackBg

		return (
			getConnectionNodeInfo(connection.sourceType).stateSelector(roomState, connection.sourceId).color
			||
			selectConnectionSourceColorByTargetId(roomState, connection.sourceId, processedIds.push(connection.id))
		)
	}

/** For use by a node */
export const selectConnectionSourceNotesByTargetId = (state: IClientRoomState, targetId: string, onlyFromKeyboards = false): IMidiNotes => {
	const connections = selectConnectionsWithTargetIds(state, [targetId])
		.filter(x => x.sourceType === ConnectionNodeType.virtualKeyboard || !onlyFromKeyboards)

	if (connections.count() === 0) return makeConnectionSourceNotesSelector(state)(Connection.dummy)

	const notes = connections.map(makeConnectionSourceNotesSelector(state))

	return Set.union(notes.toList())
}

export const selectConnectionSourceIdsByTarget = (state: IClientRoomState, targetId: string): List<string> => {
	return selectConnectionsWithTargetIds(state, [targetId])
		.toList()
		.map(x => x.sourceId)
}

const makeConnectionSourceNotesSelector = (roomState: IClientRoomState) => (connection: IConnection): IMidiNotes => {
	return getConnectionNodeInfo(connection.sourceType).selectActiveNotes(roomState, connection.sourceId)
}

// TODO Handle multiple ancestor connections
export const selectConnectionSourceIsActive = (roomState: IClientRoomState, id: string, processedIds = List<string>()): boolean => {
	if (processedIds.contains(id)) return false

	const connection = selectConnection(roomState, id)

	const isPlaying = getConnectionNodeInfo(connection.sourceType).selectIsActive(roomState, connection.sourceId)

	if (isPlaying !== null) {
		return isPlaying
	} else if (connection === Connection.dummy) {
		return false
	} else {
		// Get isSending now, because reasons
		return selectConnectionSourceIsSending(roomState, selectFirstConnectionIdByTargetId(roomState, connection.sourceId), processedIds.push(id))
	}
}

// TODO Handle multiple ancestor connections
export const selectConnectionSourceIsSending = (roomState: IClientRoomState, id: string, processedIds = List<string>()): boolean => {
	if (processedIds.contains(id)) return false

	const connection = selectConnection(roomState, id)

	const isSending = getConnectionNodeInfo(connection.sourceType).selectIsSending(roomState, connection.sourceId)

	if (isSending !== null) {
		return isSending
	} else if (connection === Connection.dummy) {
		return false
	} else {
		return selectConnectionSourceIsSending(roomState, selectFirstConnectionIdByTargetId(roomState, connection.sourceId), processedIds.push(id))
	}
}

export function sortConnection(connA: IConnection, connB: IConnection) {
	if (connA.sourceType !== connB.sourceType) {
		return connA.sourceType === ConnectionNodeType.gridSequencer
			? -1
			: connA.sourceType === ConnectionNodeType.infiniteSequencer
				? -1
				: 1
	} else {
		return connA.id > connB.id ? -1 : 1
	}
}

export const selectConnectionStackOrderForTarget = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithTargetIds(roomState, [connection.targetId])
	return connections.toIndexedSeq().indexOf(connection)
}

export const selectConnectionStackOrderForSource = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithSourceIds(roomState, [connection.sourceId])
	return connections.toIndexedSeq().indexOf(connection)
}
