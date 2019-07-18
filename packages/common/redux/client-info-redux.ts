import {Record} from 'immutable'
import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {ReadyAction, SelfDisconnectedAction} from './common-actions'
import {IClientAppState} from './common-redux-types'

export const clientInfoActions = {
	setClientVersion: (clientVersion: string) => ({
		type: 'SET_CLIENT_VERSION',
		clientVersion,
	} as const),
	setServerVersion: (serverVersion: string) => ({
		type: 'SET_SERVER_VERSION',
		serverVersion,
	} as const),
} as const

const makeClientInfoState = Record({
	clientVersion: '0',
	serverVersion: '0',
	isConnectingForFirstTime: true,
	isClientReady: false,
})

export type ClientInfoState = ReturnType<typeof makeClientInfoState>

export type ClientInfoAction = ActionType<typeof clientInfoActions> | ReadyAction | SelfDisconnectedAction

export const clientInfoReducer: Reducer<ClientInfoState, ClientInfoAction> =
	(clientInfo = makeClientInfoState(), action) => {
		switch (action.type) {
			case 'SET_CLIENT_VERSION': return clientInfo.set('clientVersion', action.clientVersion)
			case 'SET_SERVER_VERSION': return clientInfo.set('serverVersion', action.serverVersion)
			case 'READY': return clientInfo.set('isConnectingForFirstTime', false).set('isClientReady', true)
			case 'SELF_DISCONNECTED': return clientInfo.set('isClientReady', false)
			default: return clientInfo
		}
	}

export function selectClientInfo(state: IClientAppState) {
	return state.clientInfo
}
