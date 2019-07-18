import {createReducer, IClientAppState} from '.'

export interface IWebsocketState {
	id?: string
	info: string
}

export type SetSocketIdAction = ReturnType<typeof setSocketId>
export const setSocketId = (id: string) => ({
	type: 'SET_SOCKET_ID',
	id,
} as const)

export type SetInfoAction = ReturnType<typeof setInfo>
export const setInfo = (info: string) => ({
	type: 'SET_INFO',
	info,
} as const)

export type WebsocketReduxActions = SetInfoAction | SetSocketIdAction

export const websocketReducer = createReducer<IWebsocketState>(
	{info: '_'},
	{
		SET_SOCKET_ID: (state, {id}: SetSocketIdAction) => ({...state, id}),
		SET_INFO: (state, {info}: SetInfoAction) => ({...state, info}),
	},
)

export const selectLocalSocketId = (state: IClientAppState) => state.websocket.id
