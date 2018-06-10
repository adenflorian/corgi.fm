import {Store} from 'redux'
import * as io from 'socket.io-client'
import {logger} from './logger'
import {IMidiNote} from './MidiNote'
import {clientDisconnected, newClient, SET_CLIENTS} from './redux/clients-redux'
import {Octave} from './redux/midi-redux'
import {setVirtualKeys, virtualOctave} from './redux/virtual-keyboard-redux'
import {SET_MY_CLIENT_ID, setInfo, setSocket} from './redux/websocket-redux'

export function setupWebsocket(store: Store) {
	const socket = io.connect('/')

	logger.log('socket connected')

	store.dispatch(setSocket(socket))

	socket.on('connect', () => {
		socketInfo('connected')
		setClientId(socket.id)
	})

	function setClientId(newClientId) {
		store.dispatch({
			type: SET_MY_CLIENT_ID,
			id: newClientId,
		})
	}

	setupDefaultEventListener('disconnect')
	setupDefaultEventListener('reconnect_attempt')
	setupDefaultEventListener('reconnecting')
	setupDefaultEventListener('reconnect_error')
	setupDefaultEventListener('reconnect_failed')
	setupDefaultEventListener('ping')
	setupDefaultEventListener('reconnect')
	setupDefaultEventListener('connect_timeout')
	setupDefaultEventListener('error')
	setupDefaultEventListener('connect_error')
	setupDefaultEventListener('pong', 'pong - latency')
	setupDefaultEventListener('newClient')
	setupDefaultEventListener('clientDisconnected')

	function setupDefaultEventListener(eventName: string, friendlyName?: string) {
		socket.on(eventName, data => {
			socketInfo(`${friendlyName || eventName}: ` + JSON.stringify(data, null, 2))
		})
	}

	socket.on('clients', data => {
		logger.log('clients: ', data.clients)
		setClients(data.clients)
	})

	socket.on('newClient', data => {
		logger.log('newClient: ', data)
		store.dispatch(newClient(data.id))
	})

	socket.on('clientDisconnected', data => {
		logger.log('clientDisconnected: ', data)
		store.dispatch(clientDisconnected(data.id))
	})

	function setClients(newClients) {
		store.dispatch({
			type: SET_CLIENTS,
			clients: newClients,
		})
	}

	socket.on('notes', (data: NotesPayload) => {
		logger.log('notes: ', data)
		// setMidiForOtherClientsInstrument(data.notes)

		// store.dispatch({
		// 	type: CLIENT_NOTES,
		// 	...data,
		// })

		store.dispatch(setVirtualKeys(data.clientId, data.notes))
	})

	socket.on('octave', (data: OctavePayload) => {
		logger.log('octave: ', data)

		store.dispatch(virtualOctave(data.clientId, data.octave))
	})

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.log(info)
	}

	// /** @param {number} newFrequency */
	// function setMidiForOtherClientsInstrument(notes) {
	// 	otherClientsInstrument.setMidiNotes(notes)
	// }

	return socket
}

export type ClientId = string

export interface NotesPayload {
	notes: IMidiNote[]
	clientId: ClientId
}

export interface OctavePayload {
	octave: Octave
	clientId: ClientId
}
