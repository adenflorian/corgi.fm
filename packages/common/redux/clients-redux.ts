import * as animal from 'animal-id'
import {createSelector} from 'reselect'
import {v4} from 'uuid'
import {serverClientId} from '../common-constants'
import {getNumberInRangeFromString} from '../common-utils'
import {logger} from '../logger'
import {CssColor} from '../shamu-color'
import {
	BROADCASTER_ACTION, createDeepEqualSelector, createReducer,
	GLOBAL_SERVER_ACTION, IClientAppState, IServerState,
} from '.'

export const clientsActionTypesWhitelist: readonly string[] = [
	'SET_CLIENT_NAME',
]

export type AddClientAction = ReturnType<typeof addClient>
export const addClient = (client: IClientState) => ({
	type: 'ADD_CLIENT',
	client,
} as const)

export type SetLocalClientIdAction = ReturnType<typeof setLocalClientId>
export const setLocalClientId = (localClientId: Id) => ({
	type: 'SET_LOCAL_CLIENT_ID',
	localClientId,
} as const)

export type SetClientsAction = ReturnType<typeof setClients>
export const setClients = (clients: IClientState[]) => ({
	type: 'SET_CLIENTS',
	clients,
} as const)

export type SetClientNameAction = ReturnType<typeof setClientName>
export const setClientName = (id: ClientId, newName: string) => ({
	type: 'SET_CLIENT_NAME',
	id,
	newName: newName.substring(0, maxUsernameLength).trim(),
	GLOBAL_SERVER_ACTION,
	BROADCASTER_ACTION,
} as const)

export type SetLocalClientNameAction = ReturnType<typeof setLocalClientName>
export const setLocalClientName = (newName: string) => ({
	type: 'SET_LOCAL_CLIENT_NAME',
	newName: newName.substring(0, maxUsernameLength).trim(),
} as const)

export type ClientDisconnectedAction = ReturnType<typeof clientDisconnected>
export const clientDisconnected = (id: ClientId) => ({
	type: 'CLIENT_DISCONNECTED',
	id,
} as const)

export type ClientDisconnectingAction = ReturnType<typeof clientDisconnecting>
export const clientDisconnecting = (id: ClientId) => ({
	type: 'CLIENT_DISCONNECTING',
	id,
} as const)

export const maxUsernameLength = 42
export const minUsernameLength = 1

export interface IClientsState {
	readonly clients: IClientState[]
	readonly localClientId?: Id
}

export interface IClientState {
	readonly id: Id
	readonly color: string
	readonly name: string
	readonly socketId: string
}

const colors = [CssColor.brightBlue, CssColor.brightGreen, CssColor.brightOrange, CssColor.brightPurple, CssColor.brightYellow]

export class ClientState implements IClientState {
	public static createServerClient(): IClientState {
		return ClientState.serverClient
	}

	public static serverClient: IClientState = {
		id: serverClientId,
		socketId: 'server',
		name: 'Server',
		color: CssColor.defaultGray,
	}

	public readonly socketId: string
	public readonly id: Id
	public readonly color: string
	public readonly name: string

	public constructor({socketId, name}: {socketId: string, name: string | ''}) {
		this.id = v4()
		this.socketId = socketId
		this.name = name === '' ? createUsername(this.id) : name
			.replace(/ +(?= )/g, '')
			.trim()
			.substring(0, maxUsernameLength)
		this.color = colors[getNumberInRangeFromString(this.name, colors.length)]
	}
}

export function createUsername(id: Id = '0') {
	return animal.getId() + '-' + (id[0] || '9')
}

const initialState: IClientsState = {
	clients: [],
	localClientId: undefined,
}

export const clientsReducer = createReducer(initialState, {
	ADD_CLIENT: (state, {client}: AddClientAction) => ({
		...state,
		clients: [
			...state.clients,
			client,
		],
	}),
	SET_LOCAL_CLIENT_ID: (state, {localClientId}: SetLocalClientIdAction) => ({
		...state,
		localClientId,
	}),
	SET_CLIENTS: (state, {clients}: SetClientsAction) => ({
		...state,
		clients,
	}),
	CLIENT_DISCONNECTED: (state, {id}: ClientDisconnectedAction) => ({
		...state,
		clients: state.clients.filter(x => x.id !== id),
	}),
	CLIENT_DISCONNECTING: (state, {id}: ClientDisconnectingAction) => ({
		...state,
		clients: state.clients
			.map(x => x.id === id ? {...x, disconnecting: true} : x),
	}),
	SET_CLIENT_NAME: (state, {id, newName}: SetClientNameAction) => ({
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
	SELF_DISCONNECTED: state => ({
		...state,
		// Leave local client or empty array
		clients: state.clients.filter(x => x.id === state.localClientId),
	}),
})

export function selectClientById(state: IClientAppState, id: ClientId): IClientState {
	if (id === serverClientId) return ClientState.serverClient

	const client = selectAllClients(state).find(x => x.id === id)

	if (client) {
		return client
	} else {
		// Use for debugging fake client issues
		// logger.warn(`selectClientById was called with id '${id}'`
		// 	+ `, but no client with that id was found, returning fake`)
		return {
			color: CssColor.disabledGray,
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
			color: CssColor.disabledGray,
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
			color: CssColor.disabledGray,
			id: 'fakeLocalClientId',
			name: 'fakeLocalClient',
			socketId: 'fakeLocalClientSocketId',
		}
	}
}

export function selectLocalClientId(state: IClientAppState): Id {
	return state.clients.localClientId || 'fakeLocalClientId'
}

export const selectAllClients = (state: IClientAppState | IServerState) => state.clients.clients

export const selectClientCount = (state: IClientAppState | IServerState) => selectAllClients(state).length

export const selectAllClientsAsMap = (state: IClientAppState | IServerState) =>
	selectAllClients(state).reduce((map, client) => {
		return {
			...map,
			[client.id as string]: client,
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
