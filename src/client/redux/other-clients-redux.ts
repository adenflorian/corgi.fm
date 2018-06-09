import {ClientId} from '../websocket'

export const SET_CLIENTS = 'SET_CLIENTS'
export const NEW_CLIENT = 'NEW_CLIENT'
export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED'
export const OTHER_CLIENT_NOTES = 'OTHER_CLIENT_NOTES'

export const newClient = (id: ClientId) => {
	return {
		type: NEW_CLIENT,
		id,
	}
}

export const clientDisconnected = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTED,
		id,
	}
}

export interface IOtherClient {
	id: string,
	note: {
		frequency: number,
		note: string,
	}
}

export class OtherClient implements IOtherClient {
	public note: {
		frequency: number,
		note: string,
	}
	public id: ClientId

	constructor(client) {
		this.id = client.id
	}
}

export type IOtherClientsState = IOtherClient[]

export function otherClientsReducer(state: IOtherClientsState = [], action) {
	switch (action.type) {
		case SET_CLIENTS:
			return action.clients.map(x => new OtherClient(x))
		case NEW_CLIENT:
			return [...state, {id: action.id}]
		case CLIENT_DISCONNECTED:
			return state.filter(x => x.id !== action.id)
		case OTHER_CLIENT_NOTES:
			return state.map(client => {
				if (client.id === action.clientId) {
					return {
						...client,
						notes: action.notes,
					}
				} else {
					return client
				}
			})
		default:
			return state
	}
}
