import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {logger} from '../common/logger'
import {
	selectAllInstruments, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	selectSimpleTrackEvents, selectSimpleTrackIsPlaying, setSimpleTrackEvents,
} from '../common/redux/simple-track-redux'
import {playSimpleTrack} from '../common/redux/track-player-middleware'
import {BroadcastAction} from '../common/redux/websocket-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'
import {Clients} from './Clients'

const clients = new Clients()

export function setupServerWebSocketListeners(io: Server, store: Store) {
	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		clients.add(socket.id)
		logger.debug('clients: ', clients)

		sendNewClientToOthers(socket, clients.get(socket.id))
		syncState(socket, store)

		socket.on('notes', notesPayload => {
			logger.debug(`notes: ${socket.id} | `, notesPayload)
			clients.setNotes(socket.id, notesPayload.notes)
			socket.broadcast.emit('notes', {
				notes: notesPayload.notes,
				clientId: socket.id,
			})
		})

		socket.on('octave', octavePayload => {
			logger.debug(`octave: ${socket.id} | `, octavePayload)
			clients.setOctave(socket.id, octavePayload.octave)
			socket.broadcast.emit('octave', {
				octave: octavePayload.octave,
				clientId: socket.id,
			})
		})

		socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
			logger.log(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
			if (action.dispatchOnServer) {
				store.dispatch(action)
			}
			socket.broadcast.emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
		})

		socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
			logger.log(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)
			store.dispatch(action)
		})

		socket.on('disconnect', () => {
			logger.log(`client disconnected: ${socket.id}`)
			clients.remove(socket.id)
			sendClientDisconnected(socket.id, io)
		})
	})
}

function sendNewClientToOthers(socket, client) {
	logger.debug('sending new client info to all clients')
	socket.broadcast.emit('newClient', client)
}

function sendClientDisconnected(id, io: Server) {
	logger.debug('sending clientDisconnected to all clients')
	io.local.emit('clientDisconnected', {
		id,
	})
}

function syncState(newClientSocket: Socket, store: Store) {
	newClientSocket.emit('clients', {
		clients: clients.toArray(),
	})

	const state: IAppState = store.getState()

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setSimpleTrackEvents(selectSimpleTrackEvents(state)),
		alreadyBroadcasted: true,
		source: 'server',
	})

	if (selectSimpleTrackIsPlaying(state)) {
		newClientSocket.emit(WebSocketEvent.broadcast, {
			...playSimpleTrack(),
			alreadyBroadcasted: true,
			source: 'server',
		})
	}

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateBasicInstruments(selectAllInstruments(state)),
		alreadyBroadcasted: true,
		source: 'server',
	})
}
