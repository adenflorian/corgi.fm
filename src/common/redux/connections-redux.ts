import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {logger} from '../logger'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'
import {selectTrack} from './tracks-redux'
import {IVirtualKeyboardState, makeGetMidiOutput, selectVirtualKeyboard} from './virtual-keyboard-redux'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export const addConnection = makeServerAction(makeBroadcaster((connection: IConnection) => ({
	type: ADD_CONNECTION,
	connection,
})))

export const DELETE_CONNECTIONS = 'DELETE_CONNECTIONS'
export const deleteConnections = makeServerAction(makeBroadcaster((connectionIds: string[]) => ({
	type: DELETE_CONNECTIONS,
	connectionIds,
})))

export const UPDATE_CONNECTIONS = 'UPDATE_CONNECTIONS'
export const updateConnections = makeBroadcaster(makeActionCreator(
	UPDATE_CONNECTIONS, 'connections',
))

export interface IConnectionsState {
	connections: {
		[key: string]: IConnection,
	},
}

export enum ConnectionSourceType {
	keyboard = 'keyboard',
	track = 'track',
}

export enum ConnectionTargetType {
	instrument = 'instrument',
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
	connections: {},
}

export interface IConnectionAction extends AnyAction {
	connection: IConnection
	id: string
	connectionIds: string[]
}

export function connectionsReducer(state: IConnectionsState = initialState, action: IConnectionAction) {
	switch (action.type) {
		case ADD_CONNECTION:
			return {
				...state,
				connections: {
					...state.connections,
					[action.connection.id]: action.connection,
				},
			}
		case DELETE_CONNECTIONS:
			const newState = {...state, connections: {...state.connections}}
			action.connectionIds.forEach(x => delete newState.connections[x])
			return newState
		case UPDATE_CONNECTIONS:
			return {
				...state,
				connections: {
					...state.connections,
					...action.connections,
				},
			}
		default:
			return state
	}
}

export const selectConnection = (state: IAppState, id: string): IConnection => selectAllConnections(state)[id]
export const selectSourceByConnectionId = (state: IAppState, id: string): IVirtualKeyboardState =>
	selectVirtualKeyboard(state, selectConnection(state, id).sourceId)

export const selectAllConnectionIds = (state: IAppState) => Object.keys(selectAllConnections(state))
export const selectAllConnections = (state: IAppState) => state.connections.connections
export const selectAllConnectionsAsArray = (state: IAppState) => {
	const allConnections = selectAllConnections(state)
	return Object.keys(allConnections).map(x => allConnections[x])
}

export const selectConnectionsWithSourceOrTargetIds = (state: IAppState, sourceOrTargetIds: string[]) => {
	return selectAllConnectionsAsArray(state)
		.filter(x => sourceOrTargetIds.includes(x.sourceId) || sourceOrTargetIds.includes(x.targetId))
}

export const selectFirstConnectionByTargetId = (state: IAppState, targetId: string) =>
	selectAllConnectionsAsArray(state)
		.find(x => x.targetId === targetId)

export const getConnectionSourceColor = (state: IAppState, id: string) => {
	const connection = selectConnection(state, id)
	switch (connection.sourceType) {
		case ConnectionSourceType.keyboard:
			const virtualKeyboard = selectVirtualKeyboard(state, connection.sourceId)
			return virtualKeyboard && virtualKeyboard.color
		case ConnectionSourceType.track:
			const track = selectTrack(state, connection.sourceId)
			return track ? track.color : 'gray'
		default:
			logger.warn('couldnt find source color (unsupported connection source type)')
			return 'red'
	}
}

const getMidiOutput = makeGetMidiOutput()

export const getConnectionSourceNotes = (state: IAppState, id: string) => {
	const connection = selectConnection(state, id)
	switch (connection.sourceType) {
		case ConnectionSourceType.keyboard:
			return getMidiOutput(state, connection.sourceId)
		case ConnectionSourceType.track:
			const track = selectTrack(state, connection.sourceId)
			if (!track) return []
			if (track.index >= 0 && track.index < track.notes.length) {
				return track.notes[track.index].notes
			} else {
				return []
			}
		default:
			logger.warn('couldnt find source color (unsupported connection source type)')
			return 'red'
	}
}
