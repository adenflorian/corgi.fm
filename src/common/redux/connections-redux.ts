import {AnyAction} from 'redux'
import * as uuid from 'uuid'

export const ADD_CONNECTION = 'ADD_CONNECTION'
export const addConnection = (connection: IConnection) => ({
	type: ADD_CONNECTION,
	connection,
})

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
	connection: any
	id: string
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
		default:
			return state
	}
}

export class Connection implements IConnection {
	public id = uuid.v4()
	public sourceId: string
	public targetId: string

	constructor(sourceId, targetId) {
		this.sourceId = sourceId
		this.targetId = targetId
	}
}
