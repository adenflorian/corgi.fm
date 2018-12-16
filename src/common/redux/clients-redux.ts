import * as animal from 'animal-id'
import {v4} from 'uuid'
import {ClientId} from '../../client/websocket-listeners'
import {logger} from '../logger'
import {getColorHslByString} from '../shamu-color'
import {IClientAppState} from './client-store'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {selectLocalSocketId} from './websocket-redux'

export const ADD_CLIENT = 'ADD_CLIENT'
export const addClient = (client: IClientState) => {
	return {
		type: ADD_CLIENT,
		client,
	}
}

export const SET_CLIENTS = 'SET_CLIENTS'
export const setClients = (clients: IClientState[]) => {
	return {
		type: SET_CLIENTS,
		clients,
	}
}

export const SET_CLIENT_NAME = 'SET_CLIENT_NAME'
export const setClientName = (id: ClientId, newName: string) => {
	return {
		type: SET_CLIENT_NAME,
		id,
		newName: newName.substring(0, maxUsernameLength).trim(),
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}
}

export const SET_CLIENT_POINTER = 'SET_CLIENT_POINTER'
export const setClientPointer = (id: ClientId, pointer: IClientPointer) => {
	return {
		type: SET_CLIENT_POINTER,
		id,
		pointer,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}
}

export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED'
export const clientDisconnected = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTED,
		id,
	}
}

export const CLIENT_DISCONNECTING = 'CLIENT_DISCONNECTING'
export const clientDisconnecting = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTING,
		id,
	}
}

export const maxUsernameLength = 42

export interface IClientsState {
	clients: IClientState[]
}

export interface IClientState {
	id: string
	color: string
	name: string
	socketId: string
	pointer: IClientPointer
}

export interface IClientPointer {
	distanceFromCenterX: number
	distanceFromBoardsTop: number
	ownerId?: string
	color?: string
}

export class ClientState implements IClientState {
	public static createServerClient(): IClientState {
		return {
			id: 'server',
			socketId: 'server',
			name: 'server',
			color: 'rgb(89, 122, 166)',
			pointer: {distanceFromBoardsTop: 0, distanceFromCenterX: 0},
		}
	}

	public readonly socketId: string
	public readonly id: string
	public readonly color: string
	public readonly name: string
	public readonly pointer: IClientPointer

	constructor({socketId, name}: {socketId: string, name: string | ''}) {
		this.id = v4()
		this.socketId = socketId
		this.name = name === '' ? animal.getId() + '-' + this.id[0] : name
			.replace(/ +(?= )/g, '')
			.trim()
			.substring(0, maxUsernameLength)
		this.color = getColorHslByString(this.id)
		this.pointer = {distanceFromCenterX: 0, distanceFromBoardsTop: 0, ownerId: this.id}
	}
}

const initialState = {
	clients: [],
}

export function clientsReducer(clientsState: IClientsState = initialState, action) {
	switch (action.type) {
		case ADD_CLIENT:
			return {
				...clientsState,
				clients: [
					...clientsState.clients,
					action.client,
				],
			}
		case SET_CLIENTS:
			return {
				...clientsState,
				clients: action.clients,
			}
		case CLIENT_DISCONNECTED:
			return {
				...clientsState,
				clients: clientsState.clients.filter(x => x.id !== action.id),
			}
		case CLIENT_DISCONNECTING:
			return {
				...clientsState,
				clients: clientsState.clients
					.map(x => x.id === action.id ? {...x, disconnecting: true} : x),
			}
		case SET_CLIENT_NAME:
			return {
				...clientsState,
				clients: clientsState.clients
					.map(x => x.id === action.id ? {
						...x,
						name: action.newName
							.replace(/ +(?= )/g, '')
							.trim()
							.substring(0, maxUsernameLength),
					} : x),
			}
		case SET_CLIENT_POINTER:
			return {
				...clientsState,
				clients: clientsState.clients
					.map(x => x.id === action.id ? {...x, pointer: action.pointer} : x),
			}
		default:
			return clientsState
	}
}

export function selectClientById(state: IClientAppState, id): IClientState {
	const client = selectAllClients(state).find(x => x.id === id)
	if (client) {
		return client
	} else {
		logger.warn(`selectClientById was called with id '${id}'`
			+ `, but no client with that id was found, returning fake`)
		return {
			color: 'gray',
			id: 'fakeClientId',
			name: 'fakeClient',
			pointer: {
				distanceFromBoardsTop: 0,
				distanceFromCenterX: 0,
			},
			socketId: 'fakeClientSocketId',
		}
	}
}

export function selectClientBySocketId(state: IClientAppState, socketId): IClientState {
	const client = selectAllClients(state).find(x => x.socketId === socketId)
	if (client) {
		return client
	} else {
		logger.warn(`selectClientBySocketId was called with socketId '${socketId}'`
			+ `, but no client with that socket id was found, returning fake`)
		return {
			color: 'gray',
			id: 'fakeClientId',
			name: 'fakeClient',
			pointer: {
				distanceFromBoardsTop: 0,
				distanceFromCenterX: 0,
			},
			socketId: 'fakeClientSocketId',
		}
	}
}

export function selectIsLocalClientReady(state: IClientAppState): boolean {
	return selectAllClients(state).some(x => x.socketId === selectLocalSocketId(state))
}

export function selectLocalClient(state: IClientAppState): IClientState {
	const localClient = selectAllClients(state).find(x => x.socketId === selectLocalSocketId(state))
	if (localClient) {
		return localClient
	} else {
		logger.warn('selectLocalClient was called but localClient is not set, returning fake')
		return {
			color: 'gray',
			id: 'fakeLocalClientId',
			name: 'fakeLocalClient',
			pointer: {
				distanceFromBoardsTop: 0,
				distanceFromCenterX: 0,
			},
			socketId: 'fakeLocalClientSocketId',
		}
	}
}

export const selectAllClients = (state: IClientAppState) => state.clients.clients

export const selectAllClientsAsMap = (state: IClientAppState) => state.clients.clients.reduce((map, client) => {
	return {
		...map,
		[client.id]: client,
	}
})

export const selectAllOtherPointers = (state: IClientAppState) => {
	const localClientId = selectLocalClient(state).id
	return selectAllClients(state)
		.filter(x => x.id !== 'server' && x.id !== localClientId)
		.map(x => x.pointer)
}
