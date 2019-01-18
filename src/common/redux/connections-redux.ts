import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {logger} from '../logger'
import {selectBasicInstrument} from './basic-instruments-redux'
import {selectSampler} from './basic-sampler-redux'
import {IClientRoomState} from './common-redux-types'
import {selectGridSequencer, selectGridSequencerActiveNotes} from './grid-sequencers-redux'
import {selectInfiniteSequencer, selectInfiniteSequencerActiveNotes} from './infinite-sequencers-redux'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {IVirtualKeyboardState, makeGetKeyboardMidiOutput, selectVirtualKeyboardById} from './virtual-keyboard-redux'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export type AddConnectionAction = ReturnType<typeof addConnection>
export const addConnection = (connection: IConnection) => ({
	type: ADD_CONNECTION as typeof ADD_CONNECTION,
	connection,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_CONNECTIONS = 'DELETE_CONNECTIONS'
export type DeleteConnectionsAction = ReturnType<typeof deleteConnections>
export const deleteConnections = (connectionIds: string[]) => ({
	type: DELETE_CONNECTIONS as typeof DELETE_CONNECTIONS,
	connectionIds,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_ALL_CONNECTIONS = 'DELETE_ALL_CONNECTIONS'
export type DeleteAllConnectionsAction = ReturnType<typeof deleteAllConnections>
export const deleteAllConnections = () => ({
	type: DELETE_ALL_CONNECTIONS as typeof DELETE_ALL_CONNECTIONS,
})

export const UPDATE_CONNECTIONS = 'UPDATE_CONNECTIONS'
export type UpdateConnectionsAction = ReturnType<typeof updateConnections>
export const updateConnections = (connections: IConnections) => ({
	type: UPDATE_CONNECTIONS as typeof UPDATE_CONNECTIONS,
	connections,
	BROADCASTER_ACTION,
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
}

export interface ConnectionNodeInfo {
	[key: string]: {
		stateSelector: IConnectableStateSelector,
	}
}

export const ConnectionNodeInfo: ConnectionNodeInfo = {
	[ConnectionNodeType.keyboard]: {
		stateSelector: selectVirtualKeyboardById,
	},
	[ConnectionNodeType.gridSequencer]: {
		stateSelector: selectGridSequencer,
	},
	[ConnectionNodeType.infiniteSequencer]: {
		stateSelector: selectInfiniteSequencer,
	},
	[ConnectionNodeType.instrument]: {
		stateSelector: selectBasicInstrument,
	},
	[ConnectionNodeType.sampler]: {
		stateSelector: selectSampler,
	},
	[ConnectionNodeType.audioOutput]: {
		stateSelector: () => ({
			id: 'audioOutput',
			color: 'black',
		}),
	},
}

export interface IConnection {
	sourceId: string
	sourceType: ConnectionNodeType
	targetId: string
	targetType: ConnectionNodeType
	id: string
}

export type IConnectableStateSelector = (roomState: IClientRoomState, id: string) => IConnectable

export interface IConnectable {
	id: string
	color: string
	isPlaying?: boolean
}

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export class Connection implements IConnection {
	public id = uuid.v4()

	constructor(
		public sourceId: string,
		public sourceType: ConnectionNodeType,
		public targetId: string,
		public targetType: ConnectionNodeType,
	) {}
}

export type IConnectionAction = AddConnectionAction | DeleteConnectionsAction
	| DeleteAllConnectionsAction | UpdateConnectionsAction

const connectionsSpecificReducer: Reducer<IConnections, IConnectionAction> =
	(connections = Connections(), action) => {
		switch (action.type) {
			case ADD_CONNECTION: return connections.set(action.connection.id, action.connection)
			case DELETE_CONNECTIONS: return connections.deleteAll(action.connectionIds)
			case DELETE_ALL_CONNECTIONS: return connections.clear()
			case UPDATE_CONNECTIONS: return connections.merge(action.connections)
			default: return connections
		}
	}

export const connectionsReducer: Reducer<IConnectionsState, IConnectionAction> = combineReducers({
	connections: connectionsSpecificReducer,
})

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectConnection = (state: IClientRoomState, id: string) =>
	selectAllConnections(state).get(id)

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
		.find(x => x.targetId === targetId)

export const selectFirstConnectionIdByTargetId = (state: IClientRoomState, targetId: string) => {
	const conn = selectFirstConnectionByTargetId(state, targetId)
	return conn ? conn.id : 'fakeConnectionId'
}

export const getConnectionSourceColorByTargetId = (state: IClientRoomState, targetId: string) =>
	selectConnectionSourceColor(state, selectFirstConnectionIdByTargetId(state, targetId))

export const selectConnectionSourceColor = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)

	if (!connection) return 'gray'

	return ConnectionNodeInfo[connection.sourceType].stateSelector(roomState, connection.sourceId).color
}

export const selectConnectionSourceIsPlaying = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)

	if (!connection) return false

	return ConnectionNodeInfo[connection.sourceType].stateSelector(roomState, connection.sourceId).isPlaying || false
}

export const selectConnectionSourceShouldHighlight = (roomState: IClientRoomState, id: string) => {
	return selectConnectionSourceNotes(roomState, id).length > 0
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
