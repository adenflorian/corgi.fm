import {List, Map, Record, Set} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {CssColor, mixColors} from '../../shamu-color'
import {emptyList} from '../../common-utils'
import {ParamInputCentering} from '../../common-types'
import {topGroupId} from '../../common-constants'
import {selectOption, AppOptions} from '../options-redux'
import {IClientAppState} from '../common-redux-types'
import {ExpNodeType} from '.'
import {
	BROADCASTER_ACTION, IClientRoomState,
	selectVirtualKeyboardById, SERVER_ACTION, VirtualKeyboardState,
	selectExpPosition,
} from '..'

export const expConnectionsActions = {
	add: (connection: ExpConnection) => ({
		type: 'EXP_ADD_CONNECTION',
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	addMultiple: (connections: List<ExpConnection>) => ({
		type: 'EXP_ADD_CONNECTIONS',
		connections,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (connectionIds: List<Id>) => ({
		type: 'EXP_DELETE_CONNECTIONS',
		connectionIds,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteAll: () => ({
		type: 'EXP_DELETE_ALL_CONNECTIONS',
	} as const),
	replaceAll: (connections: ExpConnections) => ({
		type: 'EXP_REPLACE_CONNECTIONS',
		connections,
		BROADCASTER_ACTION,
	} as const),
	updateSource: (id: Id, connectionSourceInfo: Pick<ExpConnection, 'sourceId' | 'sourcePort' | 'sourceType'>) => ({
		type: 'EXP_UPDATE_CONNECTION_SOURCE',
		id,
		connectionSourceInfo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	updateTarget: (id: Id, connectionTargetInfo: Pick<ExpConnection, 'targetId' | 'targetPort' | 'targetType'>) => ({
		type: 'EXP_UPDATE_CONNECTION_TARGET',
		id,
		connectionTargetInfo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setAudioParamInputCentering: (id: Id, centering: ParamInputCentering) => ({
		type: 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_CENTERING',
		id,
		centering,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setAudioParamInputGain: (id: Id, gain: number) => ({
		type: 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_GAIN',
		id,
		gain,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setGroup: (ids: Set<Id>, groupId: Id) => ({
		type: 'EXP_CONNECTION_SET_GROUP',
		ids,
		groupId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type ExpConnectionType = 'audio' | 'midi' | 'dummy'

export interface IExpConnection {
	readonly sourceId: Id
	readonly sourceType: ExpNodeType
	readonly targetId: Id
	readonly targetType: ExpNodeType
	readonly id: Id
	readonly sourcePort: ExpConnectionPortId
	readonly targetPort: ExpConnectionPortId
	readonly type: ExpConnectionType
	readonly audioParamInput: ExpAudioParamInputState
}

export class ExpConnection implements IExpConnection {
	public static dummy: IExpConnection = {
		sourceId: '-1',
		sourceType: 'dummy',
		targetId: '-1',
		targetType: 'dummy',
		id: '-1',
		sourcePort: 'dummySourcePortId',
		targetPort: 'dummyTargetPortId',
		type: 'dummy',
		audioParamInput: {},
	}

	public readonly id = uuid.v4()

	public constructor(
		public readonly sourceId: Id,
		public readonly sourceType: ExpNodeType,
		public readonly targetId: Id,
		public readonly targetType: ExpNodeType,
		public readonly sourcePort: ExpConnectionPortId,
		public readonly targetPort: ExpConnectionPortId,
		public readonly type: ExpConnectionType,
		public readonly audioParamInput = {} as ExpAudioParamInputState,
		public readonly groupId = topGroupId as Id | typeof topGroupId,
	) {}
}

export interface ExpAudioParamInputState {
	readonly centering?: ParamInputCentering
	readonly gain?: number
}

export type ExpConnectionPortId = Id

export type ExpConnectionAction = ActionType<typeof expConnectionsActions>

type ExpNodeConnectionsInfos = ExpConnectionsState['nodeInfos']

export type ExpConnections = Map<Id, ExpConnection>

const defaultExpNodeConnectionsInfo = Object.freeze({
	leftConnections: Map<Id, List<Id>>(),
	rightConnections: Map<Id, List<Id>>(),
})

export type ExpNodeConnectionsInfo = typeof defaultExpNodeConnectionsInfo

const makeInitialState = () => ({
	connections: Map<Id, ExpConnection>(),
	nodeInfos: Map<Id, ExpNodeConnectionsInfo>(),
})

const makeNodeInfos = () => Map<Id, ExpNodeConnectionsInfo>()

export interface ExpConnectionsState extends ReturnType<typeof makeInitialState> {}

export function expConnectionsReducer(state = makeInitialState(), action: ExpConnectionAction): ExpConnectionsState {
	switch (action.type) {
		case 'EXP_ADD_CONNECTION': return {
			...state,
			connections: state.connections.set(action.connection.id, action.connection),
			nodeInfos: updateNodeInfosWithNewConnection(state.nodeInfos, action.connection),
		}
		case 'EXP_ADD_CONNECTIONS': return {
			...state,
			connections: state.connections.concat(action.connections.reduce((map, val) => map.set(val.id, val), Map<Id, ExpConnection>())),
			nodeInfos: updateNodeInfosWithNewConnections(state.nodeInfos, action.connections),
		}
		case 'EXP_DELETE_CONNECTIONS': {
			const deletedConnections = state.connections.filter(x => action.connectionIds.includes(x.id))
			return {
				...state,
				connections: state.connections.deleteAll(action.connectionIds),
				nodeInfos: updateNodeInfosWithDeletedConnections(state.nodeInfos, deletedConnections),
			}
		}
		case 'EXP_DELETE_ALL_CONNECTIONS': return {
			...state,
			connections: state.connections.clear(),
			nodeInfos: makeNodeInfos(),
		}
		case 'EXP_REPLACE_CONNECTIONS': {
			const connections = Map<Id, ExpConnection>().merge(action.connections)
			return {
				connections,
				nodeInfos: updateNodeInfosWithNewConnections(makeNodeInfos(), connections.toList()),
			}
		}
		case 'EXP_UPDATE_CONNECTION_SOURCE': {
			const connection = state.connections.get(action.id, null)
			if (!connection) return state
			const updatedConnection = {...connection, ...action.connectionSourceInfo}
			return {
				...state,
				connections: state.connections.set(action.id, updatedConnection),
				nodeInfos: updateNodeInfosWithUpdatedConnectionSource(state.nodeInfos, connection, updatedConnection),
			}
		}
		case 'EXP_UPDATE_CONNECTION_TARGET': {
			const connection = state.connections.get(action.id, null)
			if (!connection) return state
			const updatedConnection = {...connection, ...action.connectionTargetInfo}
			return {
				...state,
				connections: state.connections.set(action.id, updatedConnection),
				nodeInfos: updateNodeInfosWithUpdatedConnectionTarget(state.nodeInfos, connection, updatedConnection),
			}
		}
		case 'EXP_CONNECTION_SET_GROUP': {
			return {
				...state,
				connections: state.connections.withMutations(mutable => {
					action.ids.forEach(id => {
						mutable.update(id, connection => ({...connection, groupId: action.groupId}))
					})
				}),
			}
		}
		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_GAIN':
		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_CENTERING': {
			const connection = state.connections.get(action.id, null)
			if (!connection) return state
			const updatedConnection: ExpConnection = {
				...connection,
				audioParamInput: audioParamInputReducer(connection.audioParamInput, action),
			}
			return {
				...state,
				connections: state.connections.set(action.id, updatedConnection),
			}
		}
		default: return state
	}
}

function audioParamInputReducer(state = {} as ExpAudioParamInputState, action: ExpConnectionAction): ExpAudioParamInputState {
	switch (action.type) {
		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_CENTERING': return {...state, centering: action.centering}
		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_GAIN': return {...state, gain: action.gain}
		default: return state
	}
}

function updateNodeInfosWithUpdatedConnectionSource(nodeInfos: ExpNodeConnectionsInfos, previousConnection: ExpConnection, updatedConnection: ExpConnection): ExpNodeConnectionsInfos {
	return nodeInfos
		.update(previousConnection.sourceId, defaultExpNodeConnectionsInfo, deleteNodeRightConnection(previousConnection))
		.update(updatedConnection.sourceId, defaultExpNodeConnectionsInfo, addNodeRightConnection(updatedConnection))
}

function updateNodeInfosWithUpdatedConnectionTarget(nodeInfos: ExpNodeConnectionsInfos, previousConnection: ExpConnection, updatedConnection: ExpConnection): ExpNodeConnectionsInfos {
	return nodeInfos
		.update(previousConnection.targetId, defaultExpNodeConnectionsInfo, deleteNodeLeftConnection(previousConnection))
		.update(updatedConnection.targetId, defaultExpNodeConnectionsInfo, addNodeLeftConnection(updatedConnection))
}

function updateNodeInfosWithDeletedConnections(nodeInfos: ExpNodeConnectionsInfos, deletedConnections: ExpConnections): ExpNodeConnectionsInfos {
	return deletedConnections.reduce(updateNodeInfosWithDeletedConnection, nodeInfos)
}

function updateNodeInfosWithDeletedConnection(nodeInfos: ExpNodeConnectionsInfos, deletedConnection: ExpConnection): ExpNodeConnectionsInfos {
	return nodeInfos
		.update(deletedConnection.sourceId, defaultExpNodeConnectionsInfo, deleteNodeRightConnection(deletedConnection))
		.update(deletedConnection.targetId, defaultExpNodeConnectionsInfo, deleteNodeLeftConnection(deletedConnection))
}

function updateNodeInfosWithNewConnections(nodeInfos: ExpNodeConnectionsInfos, connections: List<ExpConnection>): ExpNodeConnectionsInfos {
	return connections.reduce(updateNodeInfosWithNewConnection, nodeInfos)
}

// function deserializeNodeInfos(nodeInfos: ExpNodeConnectionsInfos): ExpNodeConnectionsInfos {
// 	return Map<Id, NodeConnectionsInfo>().merge(nodeInfos).map(deserializeNodeInfo)
// }

// function deserializeNodeInfo(nodeInfo: NodeConnectionsInfo): NodeConnectionsInfo {
// 	return {
// 		leftConnections: Map<number, List<Id>>().merge(nodeInfo.leftConnections).map(x => List(x)),
// 		rightConnections: Map<number, List<Id>>().merge(nodeInfo.rightConnections).map(x => List(x)),
// 	}
// }

const updateNodeInfosWithNewConnection = (nodeInfos: ExpNodeConnectionsInfos, connection: ExpConnection): ExpNodeConnectionsInfos => {
	return nodeInfos
		.update(connection.sourceId, defaultExpNodeConnectionsInfo, addNodeRightConnection(connection))
		.update(connection.targetId, defaultExpNodeConnectionsInfo, addNodeLeftConnection(connection))
}

const addNodeRightConnection = (connection: ExpConnection) => (x: ExpNodeConnectionsInfo): ExpNodeConnectionsInfo => {
	return {
		...x,
		rightConnections: x.rightConnections.update(connection.sourcePort, List(), addConnectionToConnections(connection)),
	}
}

const addNodeLeftConnection = (connection: ExpConnection) => (x: ExpNodeConnectionsInfo): ExpNodeConnectionsInfo => {
	return {
		...x,
		leftConnections: x.leftConnections.update(connection.targetPort, List(), addConnectionToConnections(connection)),
	}
}

const addConnectionToConnections = (connection: ExpConnection) => (connectionIds: List<Id>): List<Id> => {
	return connectionIds.push(connection.id)
}

const deleteNodeRightConnection = (connection: ExpConnection) => (x: ExpNodeConnectionsInfo): ExpNodeConnectionsInfo => {
	return {
		...x,
		rightConnections: x.rightConnections.update(connection.sourcePort, List(), removeConnectionToConnections(connection)),
	}
}

const deleteNodeLeftConnection = (connection: ExpConnection) => (x: ExpNodeConnectionsInfo): ExpNodeConnectionsInfo => {
	return {
		...x,
		leftConnections: x.leftConnections.update(connection.targetPort, List(), removeConnectionToConnections(connection)),
	}
}

const removeConnectionToConnections = (connection: ExpConnection) => (connectionIds: List<Id>): List<Id> => {
	return connectionIds.filter(x => x !== connection.id)
}

export function selectExpAllConnections(state: IClientRoomState) {
	return state.expConnections.connections
}

export function selectExpAllNodeConnectionInfos(state: IClientRoomState) {
	return state.expConnections.nodeInfos
}

export function selectExpNodeConnectionInfosForNode(state: IClientRoomState, nodeId: Id): ExpNodeConnectionsInfo {
	return selectExpAllNodeConnectionInfos(state).get(nodeId, defaultExpNodeConnectionsInfo)
}

export function selectExpConnectionIdsForNodeLeftPort(state: IClientRoomState, nodeId: Id, port: Id): List<Id> {
	return selectExpNodeConnectionInfosForNode(state, nodeId).leftConnections.get(port, emptyList)
}

export function selectExpConnectionIdsForNodeRightPort(state: IClientRoomState, nodeId: Id, port: Id): List<Id> {
	return selectExpNodeConnectionInfosForNode(state, nodeId).rightConnections.get(port, emptyList)
}

export function selectExpConnection(state: IClientRoomState, id: Id) {
	return selectExpAllConnections(state).get(id) || ExpConnection.dummy
}

export function createExpConnectionSelector(id: Id) {
	return (state: IClientAppState) => {
		return selectExpConnection(state.room, id)
	}
}

export function selectExpSourceByConnectionId(state: IClientRoomState, id: Id): VirtualKeyboardState {
	return selectVirtualKeyboardById(state, selectExpConnection(state, id)!.sourceId)
}

export const selectExpAllConnectionIds = createSelector(
	selectExpAllConnections,
	function _selectAllConnectionIds(connections) {
		return connections.keySeq().toArray()
	}
)

export const selectExpSortedConnections = createSelector(
	selectExpAllConnections,
	function _selectSortedConnections(connections) {
		return connections.sort(sortExpConnection).toList()
	}
)

export function selectExpConnectionIdsOnPortOnNodeLeft(state: IClientRoomState, nodeId: Id, port: Id) {
	return selectExpNodeConnectionInfosForNode(state, nodeId).leftConnections.get(port, emptyList)
}

export function selectExpConnectionIdsOnPortOnNodeRight(state: IClientRoomState, nodeId: Id, port: Id) {
	return selectExpNodeConnectionInfosForNode(state, nodeId).leftConnections.get(port, emptyList)
}

// TODO Use node infos
export function selectExpConnectionsWithSourceOrTargetIds(state: IClientRoomState, sourceOrTargetIds: Id[]) {
	return selectExpAllConnections(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

// TODO Use node infos
export function selectExpConnectionsWithTargetIds2(connections: ExpConnections, targetId: Id) {
	return connections.filter(x => x.targetId === targetId)
}

export function selectExpConnectionsWithTargetIds(state: IClientRoomState, targetId: Id) {
	// return selectExpNodeConnectionInfosForNode(state, targetId).leftConnections.reduce((result, id) => result.set(id, selectExpConnection(state, id)), emptyMap as ExpConnections)
	return selectExpConnectionsWithTargetIds2(selectExpAllConnections(state), targetId)
}

// TODO Use node infos
export function selectExpConnectionsWithSourceId2(connections: ExpConnections, sourceId: Id) {
	return connections.filter(x => x.sourceId === sourceId)
}

export function selectExpConnectionsWithSourceId(state: IClientRoomState, sourceId: Id) {
	return selectExpConnectionsWithSourceId2(selectExpAllConnections(state), sourceId)
}

// TODO Use node infos
export function selectExpConnectionsWithSourceIds2(connections: ExpConnections, sourceIds: Id[]) {
	return connections.filter(x => sourceIds.includes(x.sourceId))
}

export function selectExpConnectionsWithSourceIds(state: IClientRoomState, sourceIds: Id[]) {
	return selectExpConnectionsWithSourceIds2(selectExpAllConnections(state), sourceIds)
}

export function doesExpConnectionBetweenNodesExist(
	state: IClientRoomState, sourceId: Id, sourcePort: Id, targetId: Id, targetPort: Id
): boolean {
	const a = selectExpConnectionIdsForNodeRightPort(state, sourceId, sourcePort)
	const b = selectExpConnectionIdsForNodeLeftPort(state, targetId, targetPort)
	return a.some(x => b.includes(x))
}

export function selectExpFirstConnectionByTargetId(state: IClientRoomState, targetId: Id) {
	return selectExpAllConnections(state)
		.find(x => x.targetId === targetId) || ExpConnection.dummy
}

export function selectExpFirstConnectionIdByTargetId(state: IClientRoomState, targetId: Id): Id {
	const conn = selectExpFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

const colorIfLowGraphics = CssColor.blue

export function createExpSmartNodeColorSelector(id: Id) {
	return (state: IClientAppState) => selectExpConnectionSourceColorByTargetId(state, id)
}

/** For use by a node */
export function selectExpConnectionSourceColorByTargetId(
	state: IClientAppState, targetId: Id, processedIds = List<Id>(),
): string {
	if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics

	const connections = selectExpConnectionsWithTargetIds(state.room, targetId)

	const positionColor = selectExpPosition(state.room, targetId).color

	if (typeof positionColor === 'string') return positionColor

	if (connections.count() === 0) return CssColor.disabledGray

	const colors = connections.map(makeConnectionSourceColorSelector(state, processedIds))

	return mixColors(colors.toList())
}

/** For use by a connection */
export function selectExpConnectionSourceColor(state: IClientAppState, id: Id): string {
	if (!selectOption(state, AppOptions.graphicsMultiColoredConnections)) return colorIfLowGraphics
	const connection = selectExpConnection(state.room, id)

	return makeConnectionSourceColorSelector(state)(connection)
}

const makeConnectionSourceColorSelector =
	(state: IClientAppState, processedIds = List<Id>()) => function _makeConnectionSourceColorSelector(connection: IExpConnection): string {
		// If in a loop
		if (processedIds.contains(connection.id)) return CssColor.disabledGray

		return (
			tryGetColorFromState(selectExpPosition(state.room, connection.sourceId).color, connection.sourcePort)
			||
			selectExpConnectionSourceColorByTargetId(state, connection.sourceId, processedIds.push(connection.id))
		)
	}

function tryGetColorFromState(colorFromState: string | false, portNumber: Id): string | false {
	if (!colorFromState) return false
	return colorFromState
}

export function selectExpConnectionSourceIdsByTarget(state: IClientRoomState, targetId: Id): List<Id> {
	return selectExpConnectionsWithTargetIds(state, targetId)
		.toList()
		.map(x => x.sourceId)
}

// TODO Handle multiple ancestor connections
export function selectExpConnectionSourceIsActive(roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean {
	return false
}

// TODO Handle multiple ancestor connections
export function selectExpConnectionSourceIsSending(roomState: IClientRoomState, id: Id, processedIds = List<Id>()): boolean {
	return false
}

export function sortExpConnection(connA: ExpConnection, connB: ExpConnection) {
	return connA.id > connB.id ? -1 : 1
}

export function selectExpConnectionStackOrderForTarget(roomState: IClientRoomState, id: Id) {
	const connection = selectExpConnection(roomState, id)
	return selectExpConnectionIdsForNodeLeftPort(roomState, connection.targetId, connection.targetPort).indexOf(connection.id)
}

export function selectExpConnectionStackOrderForSource(roomState: IClientRoomState, id: Id) {
	const connection = selectExpConnection(roomState, id)
	return selectExpConnectionIdsForNodeRightPort(roomState, connection.sourceId, connection.sourcePort).indexOf(connection.id)
}

export function calculateExpConnectorPositionY(parentY: number, parentHeight: number, portCount: number, port: number) {
	return parentY + ((parentHeight / (1 + portCount)) * (port + 1))
}
