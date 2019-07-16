import * as sinon from 'sinon'
import * as uuid from 'uuid'
import * as shamuColor from '../shamu-color'
import {addClient, clientsReducer, ClientState} from './index'

describe('clients-redux', () => {
	describe('clientsReducer', () => {
		describe('ADD_CLIENT', () => {
			let sandbox: sinon.SinonSandbox

			beforeEach(() => {
				sandbox = sinon.createSandbox()
				sandbox.stub(uuid, 'v4')
				sandbox.stub(shamuColor, 'getColorHslByString').returns('fakeColorString')
			})

			afterEach(() => {
				sandbox.restore()
			})

			const tests = [
				{
					name: 'add new client',
					initialState: () => ({
						clients: [
							new ClientState({socketId: '123', name: 'aaa'}),
							new ClientState({socketId: '444', name: 'ddd'}),
						],
					}),
					action: () => addClient(new ClientState({socketId: '777', name: 'fff'})),
					expectedState: () => ({
						clients: [
							new ClientState({socketId: '123', name: 'aaa'}),
							new ClientState({socketId: '444', name: 'ddd'}),
							new ClientState({socketId: '777', name: 'fff'}),
						],
					}),
				},
				{
					name: 'should push on new client even if existing socketId?',
					initialState: () => ({
						clients: [
							new ClientState({socketId: '123', name: 'sss'}),
							new ClientState({socketId: '777', name: 'ggg'}),
							new ClientState({socketId: '444', name: 'jjj'}),
						],
					}),
					action: () => addClient(new ClientState({socketId: '777', name: 'hhh'})),
					expectedState: () => ({
						clients: [
							new ClientState({socketId: '123', name: 'sss'}),
							new ClientState({socketId: '777', name: 'ggg'}),
							new ClientState({socketId: '444', name: 'jjj'}),
							new ClientState({socketId: '777', name: 'hhh'}),
						],
					}),
				},
			]

			tests.forEach(test => {
				it(test.name, () => {
					expect(clientsReducer(test.initialState(), test.action()))
						.toEqual(test.expectedState())
				})
			})
		})
	})
})
