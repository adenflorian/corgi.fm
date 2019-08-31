import {List, Map, Set} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {ConnectionNodeType} from '../common-types'
import {IMidiNotes, IMidiNote} from '../MidiNote'
import {CssColor, mixColors} from '../shamu-color'
import {selectOption, AppOptions} from './options-redux'
import {IClientAppState} from './common-redux-types'
import {
	BROADCASTER_ACTION, findNodeInfo, IClientRoomState,
	selectVirtualKeyboardById, SERVER_ACTION, VirtualKeyboardState,
	selectPosition,
} from '.'

export const connectionsActions = {
	add: (connection: IConnection) => ({
		type: 'ADD_CONNECTION',
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	addMultiple: (connections: List<IConnection>) => ({
		type: 'ADD_CONNECTIONS',
		connections,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (connectionIds: List<Id>) => ({
		type: 'DELETE_CONNECTIONS',
		connectionIds,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteAll: () => ({
		type: 'DELETE_ALL_CONNECTIONS',
	} as const),
	replaceAll: (connections: IConnections) => ({
		type: 'REPLACE_CONNECTIONS',
		connections,
		BROADCASTER_ACTION,
	} as const),
	update: (id: Id, connection: Partial<IConnection>) => ({
		type: 'UPDATE_CONNECTION',
		id,
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export interface IConnectionsState {
	connections: IConnections
}

export type IConnections = Map<Id, IConnection>

export const Connections = Map

export interface IConnection {
	sourceId: Id
	sourceType: ConnectionNodeType
	targetId: Id
	targetType: ConnectionNodeType
	id: Id
	sourcePort: ConnectionPortId
	targetPort: ConnectionPortId
}

export class Connection implements IConnection {
	public static dummy: IConnection = {
		sourceId: '-1',
		sourceType: ConnectionNodeType.dummy,
		targetId: '-1',
		targetType: ConnectionNodeType.dummy,
		id: '-1',
		sourcePort: 0,
		targetPort: 0,
	}

	public readonly id = uuid.v4()

	public constructor(
		public readonly sourceId: Id,
		public readonly sourceType: ConnectionNodeType,
		public readonly targetId: Id,
		public readonly targetType: ConnectionNodeType,
		public readonly sourcePort: ConnectionPortId,
		public readonly targetPort: ConnectionPortId,
	) {}
}

export type ConnectionPortId = number

export type IConnectionAction = ActionType<typeof connectionsActions>

const connectionsSpecificReducer: Reducer<IConnections, IConnectionAction> =
	(connections = Connections(), action) => {
		switch (action.type) {
			case 'ADD_CONNECTION': return connections.set(action.connection.id, action.connection)
			case 'ADD_CONNECTIONS': return connections.concat(action.connections.reduce((map, val) => map.set(val.id, val), Map<Id, IConnection>()))
			case 'DELETE_CONNECTIONS': return connections.deleteAll(action.connectionIds)
			case 'DELETE_ALL_CONNECTIONS': return connections.clear()
			case 'REPLACE_CONNECTIONS': return Map<Id, IConnection>().merge(action.connections)
			case 'UPDATE_CONNECTION': return connections.update(action.id, x => ({...x, ...action.connection}))
			default: return connections
		}
	}

export const connectionsReducer: Reducer<IConnectionsState, any> = combineReducers({
	connections: connectionsSpecificReducer,
})

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectConnection = (state: IClientRoomState, id: Id) =>
	selectAllConnections(state).get(id) || Connection.dummy

export const selectSourceByConnectionId = (state: IClientRoomState, id: Id): VirtualKeyboardState =>
	selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)

export const selectAllConnectionIds = createSelector(
	selectAllConnections,
	connections => connections.keySeq().toArray(),
)

export const selectSortedConnections = createSelector(
	selectAllConnections,
	connections => connections.sort(sortConnection).toList(),
)

export const selectConnectionsWithSourceOrTargetIds = (state: IClientRoomState, sourceOrTargetIds: Id[]) => {
	return selectAllConnections(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export const selectConnectionsWithTargetIds2 = (connections: IConnections, targetIds: Id[]) => {
	return connections.filter(x => targetIds.includes(x.targetId))
}

export const selectConnectionsWithTargetIds = (state: IClientRoomState, targetIds: Id[]) => {
	return selectConnectionsWithTargetIds2(selectAllConnections(state), targetIds)
}

export const selectConnectionsWithSourceIds2 = (connections: IConnections, sourceIds: Id[]) => {
	return connections.filter(x => sourceIds.includes(x.sourceId))
}

export const selectConnectionsWithSourceIds = (state: IClientRoomState, sourceIds: Id[]) => {
	return selectConnectionsWithSourceIds2(selectAllConnections(state), sourceIds)
}

export const selectConnectionsWithSourceAndTargetId = (
	state: IClientRoomState, sourceId: Id, sourcePort: number, targetId: Id, targetPort: number
) => {
	return selectAllConnections(state)
		.filter(x => x.sourceId === sourceId && x.sourcePort === sourcePort && x.targetId === targetId && x.targetPort === targetPort)
}

export const doesConnectionBetweenNodesExist = (
	state: IClientRoomState, sourceId: Id, sourcePort: number, targetId: Id, targetPort: number
): boolean => {
	return selectConnectionsWithSourceAndTargetId(state, sourceId, sourcePort, targetId, targetPort).count() > 0
}

export const selectFirstConnectionByTargetId = (state: IClientRoomState, targetId: Id) =>
	selectAllConnections(state)
		.find(x => x.targetId === targetId) || Connection.dummy

export const selectFirstConnectionIdByTargetId = (state: IClientRoomState, targetId: Id): Id => {
	const conn = selectFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

export const createSelectPlaceholdersInfo = () => createSelector(
	(state: IClientRoomState, _: any) => selectAllConnections(state),
	(_, parentId: Id) => parentId,
	(allConnections, parentId: Id) => {
		return {
			leftConnections: selectConnectionsWithTargetIds2(allConnections, [parentId]),
			rightConnections: selectConnectionsWithSourceIds2(allConnections, [parentId]),
		}
	},
)

const colorIfLowGraphics = CssColor.blue

export function createSmartNodeColorSelector(id: Id) {
	return (state: IClientAppState) => selectConnectionSourceColorByTargetId(state, id)
}

/** For use by a node */
export const selectConnectionSourceColorByTargetId =
	(state: IClientAppState, targetId: Id, processedIds = List<Id>()): string => {
		if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics

		const connections = selectAllConnections(state.room).filter(x => x.targetId === targetId)

		const positionColor = selectPosition(state.room, targetId).color

		if (typeof positionColor === 'string') return positionColor

		if (connections.count() === 0) return CssColor.disabledGray

		const colors = connections.map(makeConnectionSourceColorSelector(state, processedIds))

		return mixColors(colors.toList())
	}

/** For use by a connection */
export const selectConnectionSourceColor = (state: IClientAppState, id: Id): string => {
	if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics
	const connection = selectConnection(state.room, id)

	return makeConnectionSourceColorSelector(state)(connection)
}

const makeConnectionSourceColorSelector =
	(state: IClientAppState, processedIds = List<Id>()) => (connection: IConnection): string => {
		// If in a loop
		if (processedIds.contains(connection.id)) return CssColor.disabledGray

		return (
			tryGetColorFromState(selectPosition(state.room, connection.sourceId).color, connection.sourcePort)
			||
			selectConnectionSourceColorByTargetId(state, connection.sourceId, processedIds.push(connection.id))
		)
	}

function tryGetColorFromState(colorFromState: string | false | List<string>, portNumber: number): string | false {
	if (!colorFromState) return false
	if (typeof colorFromState === 'string') return colorFromState
	return colorFromState.get(portNumber, CssColor.defaultGray)
}

export const selectConnectionSourceIdsByTarget = (state: IClientRoomState, targetId: Id): List<Id> => {
	return selectConnectionsWithTargetIds(state, [targetId])
		.toList()
		.map(x => x.sourceId)
}

// TODO Handle multiple ancestor connections
export const selectConnectionSourceIsActive = (roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean => {
	if (processedIds.contains(id)) return false

	const connection = selectConnection(roomState, id)

	const isPlaying = findNodeInfo(connection.sourceType).selectIsActive(roomState, connection.sourceId)

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
export const selectConnectionSourceIsSending = (roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean => {
	if (processedIds.contains(id)) return false

	const connection = selectConnection(roomState, id)

	const isSending = findNodeInfo(connection.sourceType).selectIsSending(roomState, connection.sourceId)

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

export const selectConnectionStackOrderForTarget = (roomState: IClientRoomState, id: Id) => {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithTargetIds(roomState, [connection.targetId])
		.filter(x => x.targetPort === connection.targetPort)
	return connections.toIndexedSeq().indexOf(connection)
}

export const selectConnectionStackOrderForSource = (roomState: IClientRoomState, id: Id) => {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithSourceIds(roomState, [connection.sourceId])
		.filter(x => x.sourcePort === connection.sourcePort)
	return connections.toIndexedSeq().indexOf(connection)
}

export const calculateConnectorPositionY = (parentY: number, parentHeight: number, portCount: number, port: number) => {
	return parentY + ((parentHeight / (1 + portCount)) * (port + 1))
}
