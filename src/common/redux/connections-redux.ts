import {Map} from 'immutable'
import {Reducer} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {logger} from '../logger'
import {IClientRoomState} from './common-redux-types'
import {selectGlobalClockState} from './global-clock-redux'
import {selectAllGridSequencers} from './grid-sequencers-redux'
import {selectAllInfiniteSequencers} from './infinite-sequencers-redux'
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

export enum ConnectionSourceType {
	keyboard = 'keyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
}

export enum ConnectionTargetType {
	instrument = 'instrument',
	sampler = 'sampler',
}

export interface IConnection {
	sourceId: string
	sourceType: ConnectionSourceType
	targetId: string
	targetType: ConnectionTargetType
	id: string
}

export class Connection implements IConnection {
	public id = uuid.v4()
	public sourceId: string
	public sourceType: ConnectionSourceType
	public targetId: string
	public targetType: ConnectionTargetType

	constructor(sourceId: string, sourceType: ConnectionSourceType, targetId: string, targetType: ConnectionTargetType) {
		this.sourceId = sourceId
		this.sourceType = sourceType
		this.targetId = targetId
		this.targetType = targetType
	}
}

const initialState: IConnectionsState = {
	connections: Connections(),
}

export type IConnectionAction = AddConnectionAction | DeleteConnectionsAction
	| DeleteAllConnectionsAction | UpdateConnectionsAction

export const connectionsReducer: Reducer<IConnectionsState, IConnectionAction> =
	(state = initialState, action) => {
		return {
			connections: connectionsSpecificReducer(state.connections, action),
		}
	}

export const connectionsSpecificReducer: Reducer<IConnections, IConnectionAction> =
	(connections = Connections(), action) => {
		switch (action.type) {
			case ADD_CONNECTION: return connections.set(action.connection.id, action.connection)
			case DELETE_CONNECTIONS: return connections.deleteAll(action.connectionIds)
			case DELETE_ALL_CONNECTIONS: return connections.clear()
			case UPDATE_CONNECTIONS: return connections.merge(action.connections)
			default: return connections
		}
	}

export const selectConnection = (state: IClientRoomState, id: string) =>
	selectAllConnections(state).get(id)

export const selectSourceByConnectionId = (state: IClientRoomState, id: string): IVirtualKeyboardState =>
	selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectAllConnectionIds = createSelector(
	selectAllConnections,
	connections => connections.keySeq().toArray(),
)

export const selectAllConnectionsAsArray = (state: IClientRoomState): IConnection[] =>
	selectAllConnections(state).toIndexedSeq().toArray()

export const selectSortedConnections = (state: IClientRoomState): IConnection[] =>
	selectAllConnectionsAsArray(state).sort(sortConnection)

export const selectConnectionsWithSourceOrTargetIds = (state: IClientRoomState, sourceOrTargetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
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

	switch (connection.sourceType) {
		case ConnectionSourceType.keyboard:
			const virtualKeyboard = selectVirtualKeyboardById(roomState, connection.sourceId)
			return virtualKeyboard && virtualKeyboard.color
		case ConnectionSourceType.gridSequencer:
			const gridSequencer = selectAllGridSequencers(roomState)[connection.sourceId]
			return gridSequencer ? gridSequencer.color : 'gray'
		case ConnectionSourceType.infiniteSequencer:
			const infiniteSequencer = selectAllInfiniteSequencers(roomState)[connection.sourceId]
			return infiniteSequencer ? infiniteSequencer.color : 'gray'
		default:
			throw new Error('couldnt find source color (unsupported connection source type)')
	}
}

export const selectConnectionSourceIsPlaying = (roomState: IClientRoomState, id: string) => {
	const connection = selectConnection(roomState, id)

	if (!connection) return false

	switch (connection.sourceType) {
		case ConnectionSourceType.keyboard:
			const virtualKeyboard = selectVirtualKeyboardById(roomState, connection.sourceId)
			return virtualKeyboard && virtualKeyboard.pressedKeys.length > 0
		case ConnectionSourceType.gridSequencer:
			const gridSequencer = selectAllGridSequencers(roomState)[connection.sourceId]
			return gridSequencer ? gridSequencer.isPlaying : false
		case ConnectionSourceType.infiniteSequencer:
			const infiniteSequencer = selectAllInfiniteSequencers(roomState)[connection.sourceId]
			return infiniteSequencer ? infiniteSequencer.isPlaying : false
		default:
			throw new Error('couldnt find source isPlaying (unsupported connection source type)')
	}
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
		case ConnectionSourceType.keyboard:
			return getKeyboardMidiOutput(state, connection.sourceId)
		case ConnectionSourceType.gridSequencer: {
			const gridSequencer = selectAllGridSequencers(state)[connection.sourceId]
			if (!gridSequencer) return emptyArray
			if (!gridSequencer.isPlaying) return emptyArray

			const globalClockIndex = selectGlobalClockState(state).index

			// const index = gridSequencer.index
			const index = globalClockIndex

			if (index >= 0 && gridSequencer.events.length > 0) {
				return gridSequencer.events[index % gridSequencer.events.length].notes
			} else {
				return emptyArray
			}
		}
		case ConnectionSourceType.infiniteSequencer: {
			const infiniteSequencer = selectAllInfiniteSequencers(state)[connection.sourceId]
			if (!infiniteSequencer) return emptyArray
			if (!infiniteSequencer.isPlaying) return emptyArray

			const globalClockIndex = selectGlobalClockState(state).index

			const index = globalClockIndex

			if (index >= 0 && infiniteSequencer.events.length > 0) {
				return infiniteSequencer.events[index % infiniteSequencer.events.length].notes
			} else {
				return emptyArray
			}
		}
		default:
			throw new Error('couldnt find source color (unsupported connection source type)')
	}
}

export function sortConnection(connA: IConnection, connB: IConnection) {
	if (connA.sourceType !== connB.sourceType) {
		return connA.sourceType === 'gridSequencer'
			? -1
			: connA.sourceType === 'infiniteSequencer'
				? -1
				: 1
	} else {
		return connA.id > connB.id ? -1 : 1
	}
}
