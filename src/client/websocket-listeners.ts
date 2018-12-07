import {Store} from 'redux'
import * as io from 'socket.io-client'
import {logger} from '../common/logger'
import {BASIC_INSTRUMENT_THING_TYPE} from '../common/redux/basic-instruments-redux'
import {deleteAllThings} from '../common/redux/multi-reducer'
import {TRACK_THING_TYPE} from '../common/redux/tracks-redux'
import {VIRTUAL_KEYBOARD_THING_TYPE} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {setInfo, setSocketId} from '../common/redux/websocket-redux'
import {WebSocketEvent} from '../common/server-constants'
import {selfDisconnected} from './../common/redux/common-actions'

const port = 80

export let socket

export type ClientId = string

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

	socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
		if (action.type !== 'SET_CLIENT_POINTER') {
			logger.debug('Received broadcast: ', action)
		}
		store.dispatch({...action, alreadyBroadcasted: true})
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

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.debug(info)
	}
}
