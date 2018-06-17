import * as animal from 'animal-id'
import * as express from 'express'
import * as http from 'http'
import * as path from 'path'
import * as socketIO from 'socket.io'
import {Clients} from './Clients'
import {logger} from './logger'
import {WebSocketEvent} from './server-constants'

const app = express()
const server = new http.Server(app)
const io = socketIO(server)

app.get('/', (_, res) => {
	res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.get('/daw', (_, res) => {
	res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.use(express.static(path.join(__dirname, '../client')))

const clients = new Clients()

const simpleTrackNotes = [true, false, true, false, true, true, false, false]

io.on('connection', socket => {
	logger.log('new connection | ', socket.id)

	clients.add(socket.id)
	logger.debug('clients: ', clients)

	sendClientsToNewClient(socket)
	sendNewClientToOthers(socket, clients.get(socket.id))
	sendSimpleTrackNotesToNewClient(socket)

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

	socket.on('SET_TRACK_SIMPLE_TRACK_NOTE', action => {
		logger.log(`SET_TRACK_SIMPLE_TRACK_NOTE: ${socket.id} | `, action)
		simpleTrackNotes[action.index] = action.enabled
		socket.broadcast.emit('SET_TRACK_SIMPLE_TRACK_NOTE', action)
	})

	interface RepeatToOthersPayload {
		eventName: string
	}

	socket.on(WebSocketEvent.RepeatToOthers, (payload: RepeatToOthersPayload) => {
		logger.log(`repeatToOthers: ${socket.id} | `, payload)
		socket.broadcast.emit(payload.eventName)
	})

	socket.on('disconnect', () => {
		logger.log(`client disconnected: ${socket.id}`)
		clients.remove(socket.id)
		sendClientDisconnected(socket.id)
	})
})

let nextId = 1

const engine: any = io.engine

engine.generateId = () => {
	return animal.getId() + '-' + nextId++
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

function sendSimpleTrackNotesToNewClient(newClientSocket) {
	logger.debug('sending simple track notes to new client')
	simpleTrackNotes.forEach((note, index) => {
		newClientSocket.emit('SET_TRACK_SIMPLE_TRACK_NOTE', {
			type: 'SET_TRACK_SIMPLE_TRACK_NOTE',
			index,
			enabled: note,
		})
	})
}

function sendClientDisconnected(id) {
	logger.debug('sending clientDisconnected to all clients')
	io.local.emit('clientDisconnected', {
		id,
	})
}

const port = 80

server.listen(port)

logger.log('listening on port', port)
