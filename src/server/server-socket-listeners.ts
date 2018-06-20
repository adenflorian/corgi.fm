import {AnyAction, Store} from 'redux'
import {Server} from 'socket.io'
import {logger} from '../common/logger'
import {selectSimpleTrackEvents, setSimpleTrackEvents} from '../common/redux/simple-track-redux'
import {BroadcastAction} from '../common/redux/websocket-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'
import {Clients} from './Clients'

const clients = new Clients()

export function setupServerWebSocketListeners(io: Server, store: Store) {
	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		clients.add(socket.id)
		logger.debug('clients: ', clients)

		sendClientsToNewClient(socket)
		sendNewClientToOthers(socket, clients.get(socket.id))
		sendSimpleTrackEventsToNewClient(socket, store)

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

		socket.on('disconnect', () => {
			logger.log(`client disconnected: ${socket.id}`)
			clients.remove(socket.id)
			sendClientDisconnected(socket.id, io)
		})
	})
}
function sendClientsToNewClient(newClientSocket) {
	logger.debug('sending clients info to new client')
	newClientSocket.emit('clients', {
		clients: clients.toArray(),
	})
}

function sendNewClientToOthers(socket, client) {
	logger.debug('sending new client info to all clients')
	socket.broadcast.emit('newClient', client)
}

function sendSimpleTrackEventsToNewClient(newClientSocket, store: Store) {
	logger.debug('sending simple track events to new client')
	const action: AnyAction = setSimpleTrackEvents(selectSimpleTrackEvents(store.getState()))
	newClientSocket.emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
}

function sendClientDisconnected(id, io: Server) {
	logger.debug('sending clientDisconnected to all clients')
	io.local.emit('clientDisconnected', {
		id,
	})
}
