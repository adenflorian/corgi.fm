import {Store} from 'redux'
import * as io from 'socket.io-client'
import {logger} from '../common/logger'
import {IMidiNote} from '../common/MidiNote'
import {BASIC_INSTRUMENT_THING_TYPE} from '../common/redux/basic-instruments-redux'
import {clientDisconnected, SET_CLIENTS} from '../common/redux/clients-redux'
import {deleteAllThings} from '../common/redux/multi-reducer'
import {TRACK_THING_TYPE} from '../common/redux/tracks-redux'
import {setVirtualKeys, VIRTUAL_KEYBOARD_THING_TYPE, virtualOctave} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {setInfo, setSocketId} from '../common/redux/websocket-redux'
import {WebSocketEvent} from '../common/server-constants'
import {selfDisconnected} from './../common/redux/common-actions'
import {Octave} from './music/music-types'

const port = 80

export let socket

export function setupWebsocketAndListeners(store: Store) {
	socket = io.connect(window.location.hostname + `:${port}/`)

	socket.on('connect', () => {
		logger.log('socket: connect')
		store.dispatch(setSocketId(socket.id))
	})

	socket.on('disconnect', () => {
		logger.log('socket: disconnect')
		store.dispatch(selfDisconnected())
		store.dispatch(deleteAllThings(TRACK_THING_TYPE))
		store.dispatch(deleteAllThings(VIRTUAL_KEYBOARD_THING_TYPE))
		store.dispatch(deleteAllThings(BASIC_INSTRUMENT_THING_TYPE))
	})

	setupDefaultListeners([
		['connect'],
		['disconnect'],
		['reconnect_attempt'],
		['reconnecting'],
		['reconnect_error'],
		['reconnect_failed'],
		['ping'],
		['reconnect'],
		['connect_timeout'],
		['error'],
		['connect_error'],
		['pong', 'pong - latency'],
		['newClient'],
		['clientDisconnected'],
	])

	function setupDefaultListeners(events: Array<[string, string] | [string]>) {
		events.forEach(event => setupDefaultEventListener(event[0], event[1]))
	}

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

	socket.on('clientDisconnected', data => {
		logger.log('clientDisconnected: ', data)
		store.dispatch(clientDisconnected(data.id))
	})

	socket.on('notes', (data: NotesPayload) => {
		logger.debug('notes: ', data)
		store.dispatch(setVirtualKeys(data.clientId, data.notes))
	})

	socket.on('octave', (data: OctavePayload) => {
		logger.debug('octave: ', data)
		store.dispatch(virtualOctave(data.clientId, data.octave))
	})

	socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
		logger.debug(WebSocketEvent.broadcast)
		store.dispatch({...action, alreadyBroadcasted: true})
	})

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.debug(info)
	}
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
