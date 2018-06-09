import * as io from 'socket.io-client'
import {logger} from './logger'
import {IMidiNote} from './MidiNote'
import {OTHER_CLIENT_NOTES, SET_CLIENTS} from './redux/other-clients-redux'
import {SET_MY_CLIENT_ID, setInfo, setSocket} from './redux/websocket-redux'

export function setupWebsocket(store, otherClientsInstrument) {
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

	function setupDefaultEventListener(eventName: string, friendlyName?: string) {
		socket.on(eventName, data => {
			socketInfo(`${friendlyName || eventName}: ` + JSON.stringify(data, null, 2))
		})
	}

	socket.on('clients', data => {
		logger.log('clients: ', data.clients)
		setClients(data.clients)
	})

	function setClients(newClients) {
		store.dispatch({
			type: SET_CLIENTS,
			clients: newClients,
		})
	}

	socket.on('notes', (data: NotesPayload) => {
		logger.log('notes: ', data)
		setMidiForOtherClientsInstrument(data.notes)

		store.dispatch({
			type: OTHER_CLIENT_NOTES,
			...data,
		})
	})

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.log(info)
	}

	/** @param {number} newFrequency */
	function setMidiForOtherClientsInstrument(notes) {
		otherClientsInstrument.setMidiNotes(notes)
	}

	return socket
}

export type ClientId = string

export interface NotesPayload {
	notes: IMidiNote[]
	clientId: ClientId
}
