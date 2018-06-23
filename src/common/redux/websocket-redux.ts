export interface IWebsocketState {
	myClientId?: string,
	socket?: SocketIOClient.Socket,
	info?: string
}

export const SET_MY_CLIENT_ID = 'SET_MY_CLIENT_ID'
export const SET_SOCKET = 'SET_SOCKET'
export const SET_INFO = 'SET_INFO'

export const setSocket = (socket: SocketIOClient.Socket) => ({
	type: SET_SOCKET,
	socket,
})

export const setInfo = (info: string) => ({
	type: SET_INFO,
	info,
})

export function websocketReducer(state: IWebsocketState = {info: '_'}, action): IWebsocketState {
	switch (action.type) {
		case SET_MY_CLIENT_ID:
			return {...state, myClientId: action.id}
		case SET_SOCKET:
			return {...state, socket: action.socket}
		case SET_INFO:
			return {...state, info: action.info}
		default:
			return state
	}
}

export const selectLocalClientId = state => state.websocket.myClientId
