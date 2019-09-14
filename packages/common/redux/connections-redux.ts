import {List, Map} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {ConnectionNodeType} from '../common-types'
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
	updateSource: (id: Id, connectionSourceInfo: Pick<IConnection, 'sourceId' | 'sourcePort' | 'sourceType'>) => ({
		type: 'UPDATE_CONNECTION_SOURCE',
		id,
		connectionSourceInfo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	updateTarget: (id: Id, connectionTargetInfo: Pick<IConnection, 'targetId' | 'targetPort' | 'targetType'>) => ({
		type: 'UPDATE_CONNECTION_TARGET',
		id,
		connectionTargetInfo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

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

type NodeConnectionsInfos = IConnectionsState['nodeInfos']

export type IConnections = Map<Id, IConnection>

const defaultNodeConnectionsInfo = Object.freeze({
	leftConnections: Map<number, List<Id>>(),
	rightConnections: Map<number, List<Id>>(),
})

type NodeConnectionsInfo = typeof defaultNodeConnectionsInfo

const makeInitialState = () => ({
	connections: Map<Id, IConnection>(),
	nodeInfos: Map<Id, NodeConnectionsInfo>(),
})

const makeNodeInfos = () => Map<Id, NodeConnectionsInfo>()

export interface IConnectionsState extends ReturnType<typeof makeInitialState> {}

export function connectionsReducer(state = makeInitialState(), action: IConnectionAction): IConnectionsState {
	switch (action.type) {
		case 'ADD_CONNECTION': return {
			...state,
			connections: state.connections.set(action.connection.id, action.connection),
			nodeInfos: updateNodeInfosWithNewConnection(state.nodeInfos, action.connection),
		}
		case 'ADD_CONNECTIONS': return {
			...state,
			connections: state.connections.concat(action.connections.reduce((map, val) => map.set(val.id, val), Map<Id, IConnection>())),
			nodeInfos: updateNodeInfosWithNewConnections(state.nodeInfos, action.connections),
		}
		case 'DELETE_CONNECTIONS': {
			const deletedConnections = state.connections.filter(x => action.connectionIds.includes(x.id))
			return {
				...state,
				connections: state.connections.deleteAll(action.connectionIds),
				nodeInfos: updateNodeInfosWithDeletedConnections(state.nodeInfos, deletedConnections),
			}
		}
		case 'DELETE_ALL_CONNECTIONS': return {
			...state,
			connections: state.connections.clear(),
			nodeInfos: makeNodeInfos(),
		}
		case 'REPLACE_CONNECTIONS': {
			const connections = Map<Id, IConnection>().merge(action.connections)
			return {
				connections,
				nodeInfos: updateNodeInfosWithNewConnections(makeNodeInfos(), connections.toList()),
			}
		}
		case 'UPDATE_CONNECTION_SOURCE': {
			const connection = state.connections.get(action.id, null)
			if (!connection) return state
			const updatedConnection = {...connection, ...action.connectionSourceInfo}
			return {
				...state,
				connections: state.connections.set(action.id, updatedConnection),
				nodeInfos: updateNodeInfosWithUpdatedConnectionSource(state.nodeInfos, connection, updatedConnection),
			}
		}
		case 'UPDATE_CONNECTION_TARGET': {
			const connection = state.connections.get(action.id, null)
			if (!connection) return state
			const updatedConnection = {...connection, ...action.connectionTargetInfo}
			return {
				...state,
				connections: state.connections.set(action.id, updatedConnection),
				nodeInfos: updateNodeInfosWithUpdatedConnectionTarget(state.nodeInfos, connection, updatedConnection),
			}
		}
		default: return state
	}
}

function updateNodeInfosWithUpdatedConnectionSource(nodeInfos: NodeConnectionsInfos, previousConnection: IConnection, updatedConnection: IConnection): NodeConnectionsInfos {
	return nodeInfos
		.update(previousConnection.sourceId, defaultNodeConnectionsInfo, deleteNodeRightConnection(previousConnection))
		.update(updatedConnection.sourceId, defaultNodeConnectionsInfo, addNodeRightConnection(updatedConnection))
}

function updateNodeInfosWithUpdatedConnectionTarget(nodeInfos: NodeConnectionsInfos, previousConnection: IConnection, updatedConnection: IConnection): NodeConnectionsInfos {
	return nodeInfos
		.update(previousConnection.targetId, defaultNodeConnectionsInfo, deleteNodeLeftConnection(previousConnection))
		.update(updatedConnection.targetId, defaultNodeConnectionsInfo, addNodeLeftConnection(updatedConnection))
}

function updateNodeInfosWithDeletedConnections(nodeInfos: NodeConnectionsInfos, deletedConnections: IConnections): NodeConnectionsInfos {
	return deletedConnections.reduce(updateNodeInfosWithDeletedConnection, nodeInfos)
}

function updateNodeInfosWithDeletedConnection(nodeInfos: NodeConnectionsInfos, deletedConnection: IConnection): NodeConnectionsInfos {
	return nodeInfos
		.update(deletedConnection.sourceId, defaultNodeConnectionsInfo, deleteNodeRightConnection(deletedConnection))
		.update(deletedConnection.targetId, defaultNodeConnectionsInfo, deleteNodeLeftConnection(deletedConnection))
}

function updateNodeInfosWithNewConnections(nodeInfos: NodeConnectionsInfos, connections: List<IConnection>): NodeConnectionsInfos {
	return connections.reduce(updateNodeInfosWithNewConnection, nodeInfos)
}

// function deserializeNodeInfos(nodeInfos: NodeConnectionsInfos): NodeConnectionsInfos {
// 	return Map<Id, NodeConnectionsInfo>().merge(nodeInfos).map(deserializeNodeInfo)
// }

// function deserializeNodeInfo(nodeInfo: NodeConnectionsInfo): NodeConnectionsInfo {
// 	return {
// 		leftConnections: Map<number, List<Id>>().merge(nodeInfo.leftConnections).map(x => List(x)),
// 		rightConnections: Map<number, List<Id>>().merge(nodeInfo.rightConnections).map(x => List(x)),
// 	}
// }

const updateNodeInfosWithNewConnection = (nodeInfos: NodeConnectionsInfos, connection: IConnection): NodeConnectionsInfos => {
	return nodeInfos
		.update(connection.sourceId, defaultNodeConnectionsInfo, addNodeRightConnection(connection))
		.update(connection.targetId, defaultNodeConnectionsInfo, addNodeLeftConnection(connection))
}

const addNodeRightConnection = (connection: IConnection) => (x: NodeConnectionsInfo): NodeConnectionsInfo => {
	return {
		...x,
		rightConnections: x.rightConnections.update(connection.sourcePort, List(), addConnectionToConnections(connection)),
	}
}

const addNodeLeftConnection = (connection: IConnection) => (x: NodeConnectionsInfo): NodeConnectionsInfo => {
	return {
		...x,
		leftConnections: x.leftConnections.update(connection.targetPort, List(), addConnectionToConnections(connection)),
	}
}

const addConnectionToConnections = (connection: IConnection) => (connectionIds: List<Id>): List<Id> => {
	return connectionIds.push(connection.id)
}

const deleteNodeRightConnection = (connection: IConnection) => (x: NodeConnectionsInfo): NodeConnectionsInfo => {
	return {
		...x,
		rightConnections: x.rightConnections.update(connection.sourcePort, List(), removeConnectionToConnections(connection)),
	}
}

const deleteNodeLeftConnection = (connection: IConnection) => (x: NodeConnectionsInfo): NodeConnectionsInfo => {
	return {
		...x,
		leftConnections: x.leftConnections.update(connection.targetPort, List(), removeConnectionToConnections(connection)),
	}
}

const removeConnectionToConnections = (connection: IConnection) => (connectionIds: List<Id>): List<Id> => {
	return connectionIds.filter(x => x !== connection.id)
}

export function selectAllConnections(state: IClientRoomState) {
	return state.connections.connections
}

export function selectAllNodeConnectionInfos(state: IClientRoomState) {
	return state.connections.connections
}

export function selectConnection(state: IClientRoomState, id: Id) {
	return selectAllConnections(state).get(id) || Connection.dummy
}

export function selectSourceByConnectionId(state: IClientRoomState, id: Id): VirtualKeyboardState {
	return selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)
}

export const selectAllConnectionIds = createSelector(
	selectAllConnections,
	function _selectAllConnectionIds(connections) {
		return connections.keySeq().toArray()
	}
)

export const selectSortedConnections = createSelector(
	selectAllConnections,
	function _selectSortedConnections(connections) {
		return connections.sort(sortConnection).toList()
	}
)

export function selectConnectionsWithSourceOrTargetIds(state: IClientRoomState, sourceOrTargetIds: Id[]) {
	return selectAllConnections(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export function selectConnectionsWithTargetIds2(connections: IConnections, targetId: Id) {
	return connections.filter(x => x.targetId === targetId)
}

export function selectConnectionsWithTargetIds(state: IClientRoomState, targetId: Id) {
	return selectConnectionsWithTargetIds2(selectAllConnections(state), targetId)
}

export function selectConnectionsWithSourceId2(connections: IConnections, sourceId: Id) {
	return connections.filter(x => x.sourceId === sourceId)
}

export function selectConnectionsWithSourceId(state: IClientRoomState, sourceId: Id) {
	return selectConnectionsWithSourceId2(selectAllConnections(state), sourceId)
}

export function selectConnectionsWithSourceIds2(connections: IConnections, sourceIds: Id[]) {
	return connections.filter(x => sourceIds.includes(x.sourceId))
}

export function selectConnectionsWithSourceIds(state: IClientRoomState, sourceIds: Id[]) {
	return selectConnectionsWithSourceIds2(selectAllConnections(state), sourceIds)
}

export function selectConnectionsWithSourceAndTargetId(
	state: IClientRoomState, sourceId: Id, sourcePort: number, targetId: Id, targetPort: number
) {
	return selectAllConnections(state)
		.filter(x => x.sourceId === sourceId && x.sourcePort === sourcePort && x.targetId === targetId && x.targetPort === targetPort)
}

export function doesConnectionBetweenNodesExist(
	state: IClientRoomState, sourceId: Id, sourcePort: number, targetId: Id, targetPort: number
): boolean {
	return selectConnectionsWithSourceAndTargetId(state, sourceId, sourcePort, targetId, targetPort).count() > 0
}

export function selectFirstConnectionByTargetId(state: IClientRoomState, targetId: Id) {
	return selectAllConnections(state)
		.find(x => x.targetId === targetId) || Connection.dummy
}

export function selectFirstConnectionIdByTargetId(state: IClientRoomState, targetId: Id): Id {
	const conn = selectFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

export const createSelectPlaceholdersInfo = () => createSelector(
	(state: IClientRoomState, _: any) => selectAllConnections(state),
	(_, parentId: Id) => parentId,
	(allConnections, parentId: Id) => {
		return {
			leftConnections: selectConnectionsWithTargetIds2(allConnections, parentId),
			rightConnections: selectConnectionsWithSourceId2(allConnections, parentId),
		}
	},
)

const colorIfLowGraphics = CssColor.blue

export function createSmartNodeColorSelector(id: Id) {
	return (state: IClientAppState) => selectConnectionSourceColorByTargetId(state, id)
}

/** For use by a node */
export function selectConnectionSourceColorByTargetId(
	state: IClientAppState, targetId: Id, processedIds = List<Id>(),
): string {
	if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics

	const connections = selectAllConnections(state.room).filter(x => x.targetId === targetId)

	const positionColor = selectPosition(state.room, targetId).color

	if (typeof positionColor === 'string') return positionColor

	if (connections.count() === 0) return CssColor.disabledGray

	const colors = connections.map(makeConnectionSourceColorSelector(state, processedIds))

	return mixColors(colors.toList())
}

/** For use by a connection */
export function selectConnectionSourceColor(state: IClientAppState, id: Id): string {
	if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics
	const connection = selectConnection(state.room, id)

	return makeConnectionSourceColorSelector(state)(connection)
}

const makeConnectionSourceColorSelector =
	(state: IClientAppState, processedIds = List<Id>()) => function _makeConnectionSourceColorSelector(connection: IConnection): string {
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

export function selectConnectionSourceIdsByTarget(state: IClientRoomState, targetId: Id): List<Id> {
	return selectConnectionsWithTargetIds(state, targetId)
		.toList()
		.map(x => x.sourceId)
}

// TODO Handle multiple ancestor connections
export function selectConnectionSourceIsActive(roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean {
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
export function selectConnectionSourceIsSending(roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean {
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

export function selectConnectionStackOrderForTarget(roomState: IClientRoomState, id: Id) {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithTargetIds(roomState, connection.targetId)
		.filter(x => x.targetPort === connection.targetPort)
	return connections.toIndexedSeq().indexOf(connection)
}

export function selectConnectionStackOrderForSource(roomState: IClientRoomState, id: Id) {
	const connection = selectConnection(roomState, id)
	const connections = selectConnectionsWithSourceId(roomState, connection.sourceId)
		.filter(x => x.sourcePort === connection.sourcePort)
	return connections.toIndexedSeq().indexOf(connection)
}

export function calculateConnectorPositionY(parentY: number, parentHeight: number, portCount: number, port: number) {
	return parentY + ((parentHeight / (1 + portCount)) * (port + 1))
}
