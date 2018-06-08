export const SET_CLIENTS = 'SET_CLIENTS'
export const OTHER_CLIENT_NOTE = 'OTHER_CLIENT_NOTE'

export interface IOtherClient {
	id: string,
	note: {
		frequency: number,
		note: string,
	}
}

export function otherClientsReducer(state: IOtherClient[] = [], action) {
	switch (action.type) {
		case SET_CLIENTS:
			return action.clients.map(x => ({...x, note: ''}))
		case OTHER_CLIENT_NOTE:
			return state.map(client => {
				if (client.id === action.clientId) {
					return {
						...client,
						note: {
							frequency: action.note.frequency,
							note: action.note.note || '',
						},
					}
				} else {
					return client
				}
			})
		default:
			return state
	}
}
