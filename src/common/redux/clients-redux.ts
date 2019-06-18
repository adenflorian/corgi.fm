import * as animal from 'animal-id'
import {createSelector} from 'reselect'
import {v4} from 'uuid'
import {serverClientId} from '../common-constants'
import {ClientId, Id} from '../common-types'
import {getNumberInRangeFromString} from '../common-utils'
import {logger} from '../logger'
import {CssColor} from '../shamu-color'
import {
	BROADCASTER_ACTION, createDeepEqualSelector, createReducer,
	GLOBAL_SERVER_ACTION, IClientAppState, IServerState,
	SELF_DISCONNECTED,
} from './index'

export const ADD_CLIENT = 'ADD_CLIENT'
export type AddClientAction = ReturnType<typeof addClient>
export const addClient = (client: IClientState) => {
	return {
		type: ADD_CLIENT as typeof ADD_CLIENT,
		client,
	}
}

export const SET_LOCAL_CLIENT_ID = 'SET_LOCAL_CLIENT_ID'
export type SetLocalClientIdAction = ReturnType<typeof setLocalClientId>
export const setLocalClientId = (localClientId: Id) => {
	return {
		type: SET_LOCAL_CLIENT_ID as typeof SET_LOCAL_CLIENT_ID,
		localClientId,
	}
}

export const SET_CLIENTS = 'SET_CLIENTS'
export type SetClientsAction = ReturnType<typeof setClients>
export const setClients = (clients: IClientState[]) => {
	return {
		type: SET_CLIENTS as typeof SET_CLIENTS,
		clients,
	}
}

export const SET_CLIENT_NAME = 'SET_CLIENT_NAME'
export type SetClientNameAction = ReturnType<typeof setClientName>
export const setClientName = (id: ClientId, newName: string) => {
	return {
		type: SET_CLIENT_NAME as typeof SET_CLIENT_NAME,
		id,
		newName: newName.substring(0, maxUsernameLength).trim(),
		GLOBAL_SERVER_ACTION,
		BROADCASTER_ACTION,
	}
}

export const SET_LOCAL_CLIENT_NAME = 'SET_LOCAL_CLIENT_NAME'
export type SetLocalClientNameAction = ReturnType<typeof setLocalClientName>
export const setLocalClientName = (newName: string) => {
	return {
		type: SET_LOCAL_CLIENT_NAME as typeof SET_LOCAL_CLIENT_NAME,
		newName: newName.substring(0, maxUsernameLength).trim(),
	}
}

export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED'
export type ClientDisconnectedAction = ReturnType<typeof clientDisconnected>
export const clientDisconnected = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTED as typeof CLIENT_DISCONNECTED,
		id,
	}
}

export const CLIENT_DISCONNECTING = 'CLIENT_DISCONNECTING'
export type ClientDisconnectingAction = ReturnType<typeof clientDisconnecting>
export const clientDisconnecting = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTING as typeof CLIENT_DISCONNECTING,
		id,
	}
}

export const maxUsernameLength = 42

export interface IClientsState {
	clients: IClientState[]
	localClientId?: Id
}

export interface IClientState {
	id: string
	color: string
	name: string
	socketId: string
}

const colors = [CssColor.brightBlue, CssColor.brightGreen, CssColor.brightOrange, CssColor.brightPurple, CssColor.brightYellow]

export class ClientState implements IClientState {
	public static createServerClient(): IClientState {
		return {
			id: serverClientId,
			socketId: 'server',
			name: 'server',
			color: 'rgb(89, 122, 166)',
		}
	}

	public readonly socketId: string
	public readonly id: string
	public readonly color: string
	public readonly name: string

	constructor({socketId, name}: {socketId: string, name: string | ''}) {
		this.id = v4()
		this.socketId = socketId
		this.name = name === '' ? createUsername(this.id) : name
			.replace(/ +(?= )/g, '')
			.trim()
			.substring(0, maxUsernameLength)
		this.color = colors[getNumberInRangeFromString(this.name, colors.length)]
	}
}

export function createUsername(id = '0') {
	return animal.getId() + '-' + (id[0] || '9')
}

const initialState: IClientsState = {
	clients: [],
	localClientId: undefined,
}

export const clientsReducer = createReducer(initialState, {
	[ADD_CLIENT]: (state, {client}: AddClientAction) => ({
		...state,
		clients: [
			...state.clients,
			client,
		],
	}),
	[SET_LOCAL_CLIENT_ID]: (state, {localClientId}: SetLocalClientIdAction) => ({
		...state,
		localClientId,
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
	[SELF_DISCONNECTED]: state => ({
		...state,
		// Leave local client or empty array
		clients: state.clients.filter(x => x.id === state.localClientId),
	}),
})

export function selectClientById(state: IClientAppState, id: ClientId): IClientState {
	const client = selectAllClients(state).find(x => x.id === id)
	if (client) {
		return client
	} else {
		// Use for debugging fake client issues
		// logger.warn(`selectClientById was called with id '${id}'`
		// 	+ `, but no client with that id was found, returning fake`)
		return {
			color: 'gray',
			id: 'fakeClientId',
			name: 'fakeClient',
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
			socketId: 'fakeClientSocketId',
		}
	}
}

export function selectLocalClient(state: IClientAppState): IClientState {
	const localClient = selectClientById(state, selectLocalClientId(state))

	if (!localClient.id.startsWith('fake')) {
		return localClient
	} else {
		logger.warn('selectLocalClient was called but localClient is not set, returning fake')
		return {
			color: 'gray',
			id: 'fakeLocalClientId',
			name: 'fakeLocalClient',
			socketId: 'fakeLocalClientSocketId',
		}
	}
}

export function selectLocalClientId(state: IClientAppState): string {
	return state.clients.localClientId || 'fakeLocalClientId'
}

export const selectAllClients = (state: IClientAppState | IServerState) => state.clients.clients

export const selectClientCount = (state: IClientAppState | IServerState) => selectAllClients(state).length

export const selectAllClientsAsMap = (state: IClientAppState | IServerState) =>
	selectAllClients(state).reduce((map, client) => {
		return {
			...map,
			[client.id]: client,
		}
	})

export const selectAllClientIds = createSelector(
	[selectAllClients],
	allClients => allClients.map(client => client.id),
)

export const selectAllOtherClientIds = createDeepEqualSelector(
	[selectLocalClientId, selectAllClientIds],
	(localClientId, allClientIds) =>
		allClientIds.filter(x => x !== 'server' && x !== localClientId),
)
