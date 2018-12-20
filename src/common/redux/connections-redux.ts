import {Map} from 'immutable'
import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {logger} from '../logger'
import {IClientRoomState} from './common-redux-types'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {selectTrack} from './tracks-redux'
import {IVirtualKeyboardState, makeGetKeyboardMidiOutput, selectVirtualKeyboardById} from './virtual-keyboard-redux'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export const addConnection = (connection: IConnection) => ({
	type: ADD_CONNECTION,
	connection,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_CONNECTIONS = 'DELETE_CONNECTIONS'
export const deleteConnections = (connectionIds: string[]) => ({
	type: DELETE_CONNECTIONS,
	connectionIds,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_ALL_CONNECTIONS = 'DELETE_ALL_CONNECTIONS'
export const deleteAllConnections = () => ({
	type: DELETE_ALL_CONNECTIONS,
})

export const UPDATE_CONNECTIONS = 'UPDATE_CONNECTIONS'
export const updateConnections = (connections: IConnections) => ({
	type: UPDATE_CONNECTIONS,
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
	track = 'track',
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

export interface IConnectionAction extends AnyAction {
	connection: IConnection
	id: string
	connectionIds: string[]
}

export function connectionsReducer(
	state: IConnectionsState = initialState, action: IConnectionAction,
): IConnectionsState {
	switch (action.type) {
		case ADD_CONNECTION: return {
			...state,
			connections: state.connections.set(action.connection.id, action.connection),
		}
		case DELETE_CONNECTIONS: return {
			...state,
			connections: state.connections.deleteAll(action.connectionIds),
		}
		case DELETE_ALL_CONNECTIONS: return {
			...state,
			connections: Connections(),
		}
		case UPDATE_CONNECTIONS: return {
			...state,
			connections: state.connections.merge(action.connections),
		}
		default: return state
	}
}

export const selectConnection = (state: IClientRoomState, id: string) =>
	selectAllConnections(state).get(id)

export const selectSourceByConnectionId = (state: IClientRoomState, id: string): IVirtualKeyboardState =>
	selectVirtualKeyboardById(state, selectConnection(state, id)!.sourceId)

export const selectAllConnectionIds = (state: IClientRoomState): string[] =>
	selectAllConnections(state).keySeq().toArray()

export const selectAllConnections = (state: IClientRoomState) =>
	state.connections.connections

export const selectAllConnectionsAsArray = (state: IClientRoomState): IConnection[] =>
	selectAllConnections(state).toIndexedSeq().toArray()

export const selectConnectionsWithSourceOrTargetIds = (state: IClientRoomState, sourceOrTargetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export const selectFirstConnectionByTargetId = (state: IClientRoomState, targetId: string) =>
	selectAllConnectionsAsArray(state)
		.find(x => x.targetId === targetId)

export const getConnectionSourceColor = (state: IClientRoomState, id: string) => {
	const connection = selectConnection(state, id)
	if (connection) {
		switch (connection.sourceType) {
			case ConnectionSourceType.keyboard:
				const virtualKeyboard = selectVirtualKeyboardById(state, connection.sourceId)
				return virtualKeyboard && virtualKeyboard.color
			case ConnectionSourceType.track:
				const track = selectTrack(state, connection.sourceId)
				return track ? track.color : 'gray'
			default:
				logger.warn('couldnt find source color (unsupported connection source type)')
				return 'red'
		}
	} else {
		return 'gray'
	}
}

const getKeyboardMidiOutput = makeGetKeyboardMidiOutput()

const emptyArray: number[] = []

export const selectConnectionSourceNotes = (state: IClientRoomState, id: string): number[] => {
	const connection = selectConnection(state, id)!
	switch (connection.sourceType) {
		case ConnectionSourceType.keyboard:
			return getKeyboardMidiOutput(state, connection.sourceId)
		case ConnectionSourceType.track:
			const track = selectTrack(state, connection.sourceId)
			if (!track) return emptyArray
			if (track.index >= 0 && track.index < track.events.length) {
				return track.events[track.index].notes
			} else {
				return emptyArray
			}
		default:
			logger.warn('couldnt find source notes (unsupported connection source type)')
			return emptyArray
	}
}
