export const SET_CLIENTS = 'SET_CLIENTS'
export const OTHER_CLIENT_NOTES = 'OTHER_CLIENT_NOTES'

export interface IOtherClient {
	id: string,
	note: {
		frequency: number,
		note: string,
	}
}

export type IOtherClientsState = IOtherClient[]

export function otherClientsReducer(state: IOtherClientsState = [], action) {
	switch (action.type) {
		case SET_CLIENTS:
			return action.clients.map(x => ({...x, note: ''}))
		case OTHER_CLIENT_NOTES:
			return state.map(client => {
				if (client.id === action.clientId) {
					return {
						...client,
						notes: action.notes,
					}
				} else {
					return client
				}
			})
		default:
			return state
	}
}
