import * as animal from 'animal-id'
import ColorDefault from 'color'
import * as ColorAll from 'color'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {ClientId} from '../../client/websocket-listeners'
import {IAppState} from './configureStore'
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
	pointer?: IClientPointer
}

export interface IClientPointer {
	distanceFromCenterX: number
	distanceFromBoardsTop: number
	ownerId?: string
	color?: string
}

export class ClientState implements IClientState {
	public static createServerClient() {
		return {
			id: 'server',
			socketId: 'server',
			name: 'server',
			color: 'rgb(89, 122, 166)',
		}
	}

	public readonly socketId: string
	public readonly id: string
	public readonly color: string
	public readonly name: string
	public readonly pointer: IClientPointer

	constructor({socketId, name}: {socketId: string, name: string | ''}) {
		this.id = uuid.v4()
		this.socketId = socketId
		this.name = name === '' ? animal.getId() + '-' + this.id[0] : name.substring(0, maxUsernameLength).trim()
		const colorFunc = ColorDefault || ColorAll
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
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
					.map(x => x.id === action.id ? {...x, name: action.newName.substring(0, maxUsernameLength).trim()} : x),
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

export function selectClientById(state: IAppState, id) {
	return selectAllClients(state).find(x => x.id === id)
}

export function selectClientBySocketId(state: IAppState, socketId) {
	return selectAllClients(state).find(x => x.socketId === socketId)
}

export function selectLocalClient(state: IAppState) {
	return selectAllClients(state).find(x => x.socketId === selectLocalSocketId(state))
}

export const selectAllClients = (state: IAppState) => state.clients.clients

export const selectAllClientsAsMap = (state: IAppState) => state.clients.clients.reduce((map, client) => {
	return {
		...map,
		[client.id]: client,
	}
})

export const selectAllOtherPointers = (state: IAppState) => {
	const localClientId = selectLocalClient(state).id
	return selectAllClients(state)
		.filter(x => x.id !== 'server' && x.id !== localClientId)
		.map(x => x.pointer)
}
