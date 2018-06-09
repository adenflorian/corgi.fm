import {ClientId} from '../websocket'

export const SET_CLIENTS = 'SET_CLIENTS'
export const NEW_CLIENT = 'NEW_CLIENT'
export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED'
export const CLIENT_NOTES = 'CLIENT_NOTES'

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

export interface IClient {
	id: string,
	note: {
		frequency: number,
		note: string,
	}
}

export class Client implements IClient {
	public static frombackEndClient(backEndClient: any) {
		return new Client(backEndClient.id)
	}

	public id: ClientId

	public note: {
		frequency: number,
		note: string,
	}

	constructor(id: ClientId) {
		this.id = id
	}
}

export type IClientsState = IClient[]

export function clientsReducer(state: IClientsState = [], action) {
	switch (action.type) {
		case SET_CLIENTS:
			return action.clients.map(x => Client.frombackEndClient(x))
		case NEW_CLIENT:
			return [
				...state.filter(x => x.id !== action.id),
				new Client(action.id),
			]
		case CLIENT_DISCONNECTED:
			return state.filter(x => x.id !== action.id)
		case CLIENT_NOTES:
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
