import * as animal from 'animal-id'
import {createSelector} from 'reselect'
import {v4} from 'uuid'
import {getMainBoardsRectX, getMainBoardsRectY} from '../../client/utils'
import {ClientId} from '../common-types'
import {logger} from '../logger'
import {getColorHslByString} from '../shamu-color'
import {SELF_DISCONNECTED} from './common-actions'
import {IClientAppState} from './common-redux-types'
import {IServerState} from './configure-server-store'
import {BROADCASTER_ACTION, createDeepEqualSelector, createReducer, SERVER_ACTION} from './redux-utils'
import {selectLocalSocketId} from './websocket-redux'

export const ADD_CLIENT = 'ADD_CLIENT'
export type AddClientAction = ReturnType<typeof addClient>
export const addClient = (client: IClientState) => {
	return {
		type: ADD_CLIENT,
		client,
	}
}

export const SET_CLIENTS = 'SET_CLIENTS'
export type SetClientsAction = ReturnType<typeof setClients>
export const setClients = (clients: IClientState[]) => {
	return {
		type: SET_CLIENTS,
		clients,
	}
}

export const SET_CLIENT_NAME = 'SET_CLIENT_NAME'
export type SetClientNameAction = ReturnType<typeof setClientName>
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
export type SetClientPointerAction = ReturnType<typeof setClientPointer>
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
export type ClientDisconnectedAction = ReturnType<typeof clientDisconnected>
export const clientDisconnected = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTED,
		id,
	}
}

export const CLIENT_DISCONNECTING = 'CLIENT_DISCONNECTING'
export type ClientDisconnectingAction = ReturnType<typeof clientDisconnecting>
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

const initialState: IClientsState = {
	clients: [],
}

export const clientsReducer = createReducer(initialState, {
	[ADD_CLIENT]: (state, {client}: AddClientAction) => ({
		...state,
		clients: [
			...state.clients,
			client,
		],
	}),
	[SET_CLIENTS]: (state, {clients}: SetClientsAction) => ({
		...state,
		clients,
	}),
	[CLIENT_DISCONNECTED]: (state, {id}: ClientDisconnectedAction) => ({
		...state,
		clients: state.clients.filter(x => x.id !== id),
	}),
	[CLIENT_DISCONNECTING]: (state, {id}: ClientDisconnectingAction) => ({
		...state,
		clients: state.clients
			.map(x => x.id === id ? {...x, disconnecting: true} : x),
	}),
	[SET_CLIENT_NAME]: (state, {id, newName}: SetClientNameAction) => ({
		...state,
		clients: state.clients
			.map(x => x.id === id ? {
				...x,
				name: newName
					.replace(/ +(?= )/g, '')
					.trim()
					.substring(0, maxUsernameLength),
			} : x),
	}),
	[SET_CLIENT_POINTER]: (state, {id, pointer}: SetClientPointerAction) => ({
		...state,
		clients: state.clients
			.map(x => x.id === id ? {...x, pointer} : x),
	}),
	[SELF_DISCONNECTED]: state => ({
		...state,
		clients: [],
	}),
})

export function selectClientById(state: IClientAppState, id: ClientId): IClientState {
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

export function selectClientBySocketId(state: IClientAppState | IServerState, socketId: string): IClientState {
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

export function selectLocalClientId(state: IClientAppState): string {
	return selectLocalClient(state).id
}

export const selectAllClients = (state: IClientAppState | IServerState) => state.clients.clients

export const selectClientCount = (state: IClientAppState | IServerState) => selectAllClients(state).length

export const selectAllClientsAsMap = (state: IClientAppState | IServerState) =>
	state.clients.clients.reduce((map, client) => {
		return {
			...map,
			[client.id]: client,
		}
	})

const size = 8

export const selectAllClientIds = createSelector(
	[selectAllClients],
	allClients => allClients.map(client => client.id),
)

export const selectAllOtherClientIds = createDeepEqualSelector(
	[selectLocalClientId, selectAllClientIds],
	(localClientId, allClientIds) =>
		allClientIds.filter(x => x !== 'server' && x !== localClientId),
)
export const selectClientPointerInfo = createSelector(
	[selectClientById],
	client => ({
		x: client.pointer.distanceFromCenterX
			+ getMainBoardsRectX() - (size / 2),
		y: client.pointer.distanceFromBoardsTop
			+ getMainBoardsRectY() - (size / 2),
		color: client.color,
		name: client.name,
		id: client.id,
	}),
)
