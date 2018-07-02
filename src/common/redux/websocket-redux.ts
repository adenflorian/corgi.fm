export interface IWebsocketState {
	id?: string,
	info?: string
}

export const SET_SOCKET_ID = 'SET_SOCKET_ID'
export const setSocketId = (id: string) => ({
	type: SET_SOCKET_ID,
	id,
})

export const SET_INFO = 'SET_INFO'
export const setInfo = (info: string) => ({
	type: SET_INFO,
	info,
})

export function websocketReducer(state: IWebsocketState = {info: '_'}, action): IWebsocketState {
	switch (action.type) {
		case SET_SOCKET_ID:
			return {...state, id: action.id}
		case SET_INFO:
			return {...state, info: action.info}
		default:
			return state
	}
}

export const selectLocalSocketId = state => state.websocket.id
