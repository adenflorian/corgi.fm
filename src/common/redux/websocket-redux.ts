export interface IWebsocketState {
	socket?: SocketIOClient.Socket,
	info?: string
}

export const SET_SOCKET = 'SET_SOCKET'
export const setSocket = (socket: SocketIOClient.Socket) => ({
	type: SET_SOCKET,
	socket,
})

export const SET_INFO = 'SET_INFO'
export const setInfo = (info: string) => ({
	type: SET_INFO,
	info,
})

export function websocketReducer(state: IWebsocketState = {info: '_'}, action): IWebsocketState {
	switch (action.type) {
		case SET_SOCKET:
			return {...state, socket: action.socket}
		case SET_INFO:
			return {...state, info: action.info}
		default:
			return state
	}
}

export const selectLocalSocket = state => state.websocket.socket
