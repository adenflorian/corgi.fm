import {Map, Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {logger} from '../logger'
import {CssColor} from '../shamu-color'
import {selectBasicInstrument} from './basic-instruments-redux'
import {selectSampler} from './basic-sampler-redux'
import {IClientRoomState} from './common-redux-types'
import {
	GridSequencerState, selectGridSequencer, selectGridSequencerActiveNotes,
	selectGridSequencerIsActive, selectGridSequencerIsSending,
} from './grid-sequencers-redux'
import {
	InfiniteSequencerState, selectInfiniteSequencer, selectInfiniteSequencerActiveNotes,
	selectInfiniteSequencerIsActive, selectInfiniteSequencerIsSending,
} from './infinite-sequencers-redux'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {
	IVirtualKeyboardState, makeGetKeyboardMidiOutput, selectVirtualKeyboardById,
	selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending,
} from './virtual-keyboard-redux'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export const DELETE_CONNECTIONS = 'DELETE_CONNECTIONS'
export const DELETE_ALL_CONNECTIONS = 'DELETE_ALL_CONNECTIONS'
export const UPDATE_CONNECTIONS = 'UPDATE_CONNECTIONS'
export const UPDATE_GHOST_CONNECTOR = 'UPDATE_GHOST_CONNECTOR'

export const connectionsActions = Object.freeze({
	add: (connection: IConnection) => ({
		type: ADD_CONNECTION as typeof ADD_CONNECTION,
		connection,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	delete: (connectionIds: string[]) => ({
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
	updateGhostConnector: (id: string, connector: Partial<GhostConnectorRecord>) => ({
		type: UPDATE_GHOST_CONNECTOR as typeof UPDATE_GHOST_CONNECTOR,
		id,
		connector,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export interface IConnectionsState {
	connections: IConnections
}

export type IConnections = Map<string, IConnection>

export const Connections = Map

export enum ConnectionNodeType {
	keyboard = 'keyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	instrument = 'instrument',
	sampler = 'sampler',
	audioOutput = 'audioOutput',
	masterClock = 'masterClock',
	dummy = 'dummy',
}

export interface IConnectionNodeInfo {
	stateSelector: IConnectableStateSelector,
	selectIsActive: IConnectableIsActiveSelector,
	selectIsSending: IConnectableIsActiveSelector,
	width: number,
	height: number,
}

const NodeInfoRecord = Record<IConnectionNodeInfo>({
	stateSelector: () => ({
		color: CssColor.subtleGrayBlackBg,
		id: 'oh no',
	}),
	selectIsActive: () => null,
	selectIsSending: () => null,
	width: 0,
	height: 0,
})

const NodeInfoMap = Map({
	[ConnectionNodeType.keyboard]: NodeInfoRecord({
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardIsActive,
		selectIsSending: selectVirtualKeyboardIsSending,
		width: 456,
		height: 56,
	}),
	[ConnectionNodeType.gridSequencer]: NodeInfoRecord({
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		width: GridSequencerState.defaultWidth,
		height: GridSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.infiniteSequencer]: NodeInfoRecord({
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		width: InfiniteSequencerState.defaultWidth,
		height: InfiniteSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.instrument]: NodeInfoRecord({
		stateSelector: selectBasicInstrument,
		width: 416,
		height: 56,
	}),
	[ConnectionNodeType.sampler]: NodeInfoRecord({
		stateSelector: selectSampler,
		width: 416,
		height: 56,
	}),
	[ConnectionNodeType.audioOutput]: NodeInfoRecord({
		stateSelector: () => ({id: MASTER_AUDIO_OUTPUT_TARGET_ID, color: CssColor.green}),
		width: 140.48,
		height: 48,
	}),
	[ConnectionNodeType.masterClock]: NodeInfoRecord({
		stateSelector: () => ({id: MASTER_CLOCK_SOURCE_ID, color: CssColor.blue}),
		selectIsActive: () => false,
		selectIsSending: () => false,
		width: 134.813,
		height: 72,
	}),
})

const dummyNodeInfo = NodeInfoRecord({
	stateSelector: () => ({id: 'oh no', color: CssColor.subtleGrayBlackBg, isPlaying: false}),
	width: 0,
	height: 0,
})

export const getConnectionNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return NodeInfoMap.get(type) || dummyNodeInfo
}

export enum GhostConnectorStatus {
	hidden = 'hidden',
	activeSource = 'activeSource',
	activeTarget = 'activeTarget',
}

const makeGhostConnectorRecord = Record({
	x: 0,
	y: 0,
	status: GhostConnectorStatus.hidden,
})

export const defaultGhostConnector = makeGhostConnectorRecord()

export type GhostConnectorRecord = ReturnType<typeof makeGhostConnectorRecord>

export interface IConnection {
	sourceId: string
	sourceType: ConnectionNodeType
	targetId: string
	targetType: ConnectionNodeType
	id: string
	ghostConnector: GhostConnectorRecord
}

export type IConnectableStateSelector = (roomState: IClientRoomState, id: string) => IConnectable

export type IConnectableIsActiveSelector = (roomState: IClientRoomState, id: string) => boolean | null

export type IConnectableIsSendingSelector = (roomState: IClientRoomState, id: string) => boolean | null

export interface IConnectable {
	id: string
	color: string | false
}

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export class Connection implements IConnection {
	public static dummy: IConnection = {
		sourceId: '-1',
		sourceType: ConnectionNodeType.dummy,
		targetId: '-1',
		targetType: ConnectionNodeType.dummy,
		id: '-1',
		ghostConnector: makeGhostConnectorRecord(),
	}

	public readonly id = uuid.v4()
	public readonly ghostConnector = makeGhostConnectorRecord()

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
			case UPDATE_GHOST_CONNECTOR:
				return connections.update(
					action.id,
					x => ({...x, ghostConnector: {...x.ghostConnector, ...action.connector}}),
				)
			default: return connections
		}
	}

export const connectionsReducer: Reducer<IConnectionsState, IConnectionAction> = combineReducers({
	connections: connectionsSpecificReducer,
})

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectConnection = (state: IClientRoomState, id: string) =>
	selectAllConnections(state).get(id) || Connection.dummy

export const selectSourceByConnectionId = (state: IClientRoomState, id: string): IVirtualKeyboardState =>
	selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)

export const selectAllConnectionIds = createSelector(
	selectAllConnections,
	connections => connections.keySeq().toArray(),
)

export const selectAllConnectionsAsArray = createSelector(
	selectAllConnections,
	connections => connections.toIndexedSeq().toArray(),
)

export const selectSortedConnections = createSelector(
	selectAllConnectionsAsArray,
	connections => connections.sort(sortConnection),
)

export const selectConnectionsWithSourceOrTargetIds = (state: IClientRoomState, sourceOrTargetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export const selectConnectionsWithTargetIds = (state: IClientRoomState, targetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => targetIds.includes(x.targetId))
}

export const selectConnectionsWithSourceIds = (state: IClientRoomState, targetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => targetIds.includes(x.targetId))
}

export const selectFirstConnectionByTargetId = (state: IClientRoomState, targetId: string) =>
	selectAllConnectionsAsArray(state)
		.find(x => x.targetId === targetId) || Connection.dummy

export const selectFirstConnectionIdByTargetId = (state: IClientRoomState, targetId: string): string => {
	const conn = selectFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

export const selectConnectionSourceColorByTargetId = (state: IClientRoomState, targetId: string): string =>
	selectConnectionSourceColor(state, selectFirstConnectionIdByTargetId(state, targetId))

export const selectConnectionSourceColor = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)

	return (
		getConnectionNodeInfo(connection.sourceType).stateSelector(roomState, connection.sourceId).color
		||
		selectConnectionSourceColorByTargetId(roomState, connection.sourceId)
	)
}

export const selectConnectionSourceIsActive = (roomState: IClientRoomState, id: string): boolean => {
	const connection = selectConnection(roomState, id)

	const isPlaying = getConnectionNodeInfo(connection.sourceType).selectIsActive(roomState, connection.sourceId)

	if (isPlaying !== null) {
		return isPlaying
	} else if (connection === Connection.dummy) {
		return false
	} else {
		return selectConnectionSourceIsActive(roomState, selectFirstConnectionIdByTargetId(roomState, connection.sourceId))
	}
}

export const selectConnectionSourceIsSending = (roomState: IClientRoomState, id: string): boolean => {
	const connection = selectConnection(roomState, id)

	const isSending = getConnectionNodeInfo(connection.sourceType).selectIsSending(roomState, connection.sourceId)

	if (isSending !== null) {
		return isSending
	} else if (connection === Connection.dummy) {
		return false
	} else {
		return selectConnectionSourceIsSending(roomState, selectFirstConnectionIdByTargetId(roomState, connection.sourceId))
	}
}

const getKeyboardMidiOutput = makeGetKeyboardMidiOutput()

const emptyArray: number[] = []

export const selectConnectionSourceNotesByTargetId = (state: IClientRoomState, targetId: string): number[] =>
	selectConnectionSourceNotes(state, selectFirstConnectionIdByTargetId(state, targetId))

export const selectConnectionSourceNotes = (state: IClientRoomState, id: string): number[] => {
	const connection = selectConnection(state, id)

	if (connection === undefined) {
		logger.warn(`could not find connection with id: ${id}`)
		return emptyArray
	}

	switch (connection.sourceType) {
		case ConnectionNodeType.keyboard:
			return getKeyboardMidiOutput(state, connection.sourceId)
		case ConnectionNodeType.gridSequencer:
			return selectGridSequencerActiveNotes(state, connection.sourceId)
		case ConnectionNodeType.infiniteSequencer:
			return selectInfiniteSequencerActiveNotes(state, connection.sourceId)
		default:
			return emptyArray
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
