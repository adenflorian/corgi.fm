import {expect} from 'chai'
import {Client, clientsReducer, newClient} from './clients-redux'

declare const describe: (x, y) => any
declare const it: (x, y) => any

describe('clients-redux', () => {
	describe('clientsReducer', () => {
		[
			{
				name: 'add new client',
				initialState: [
					new Client('123'),
					new Client('444'),
				],
				action: newClient('777'),
				expectedState: [
					new Client('123'),
					new Client('444'),
					new Client('777'),
				],
			},
			{
				name: 'add new already existing client',
				initialState: [
					new Client('123'),
					new Client('777'),
					new Client('444'),
				],
				action: newClient('777'),
				expectedState: [
					new Client('123'),
					new Client('444'),
					new Client('777'),
				],
			},
		].forEach(test => {
			it(test.name, () => {
				expect(clientsReducer(test.initialState, test.action))
					.to.deep.equal(test.expectedState)
			})
		})
	})
})
