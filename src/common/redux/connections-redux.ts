import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'
import {IVirtualKeyboardState, selectVirtualKeyboard} from './virtual-keyboard-redux'

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

export interface IConnection {
	sourceId: string
	targetId: string
	id: string
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

export class Connection implements IConnection {
	public id = uuid.v4()
	public sourceId: string
	public targetId: string

	constructor(sourceId: string, targetId: string) {
		this.sourceId = sourceId
		this.targetId = targetId
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
