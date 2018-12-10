import {expect} from 'chai'
import {addClient, clientsReducer, ClientState} from './clients-redux'

declare const describe: (x, y) => any
declare const it: (x, y) => any

describe('clients-redux', () => {
	describe('clientsReducer', () => {
		[
			{
				name: 'add new client',
				initialState: {
					clients: [
						new ClientState('123'),
						new ClientState('444'),
					],
				},
				action: addClient(new ClientState('777')),
				expectedState: {
					clients: [
						new ClientState('123'),
						new ClientState('444'),
						new ClientState('777'),
					],
				},
			},
			{
				name: 'add new already existing client',
				initialState: {
					clients: [
						new ClientState('123'),
						new ClientState('777'),
						new ClientState('444'),
					],
				},
				action: addClient(new ClientState('777')),
				expectedState: {
					clients: [
						new ClientState('123'),
						new ClientState('444'),
						new ClientState('777'),
					],
				},
			},
		].forEach(test => {
			it(test.name, () => {
				expect(clientsReducer(test.initialState, test.action))
					.to.deep.equal(test.expectedState)
			})
		})
	})
})
