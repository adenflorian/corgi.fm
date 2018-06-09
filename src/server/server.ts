import * as animal from 'animal-id'
import * as express from 'express'
import * as http from 'http'
import * as path from 'path'
import * as socketIO from 'socket.io'
import {Clients} from './Clients'
import {logger} from './logger'

const app = express()
const server = new http.Server(app)
const io = socketIO(server)

app.get('/', (_, res) => {
	res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.use(express.static(path.join(__dirname, '../client')))

const clients = new Clients()

io.on('connection', socket => {
	logger.log('new connection | ', socket.id)

	clients.add(socket.id)

	sendClients()

	socket.on('note', data => {
		logger.debug(`client: ${socket.id} | ${data.frequency}`)
		socket.broadcast.emit('note', {...data, clientId: socket.id})
	})

	socket.on('notes', notes => {
		logger.debug(`client: ${socket.id} | `, notes)
		socket.broadcast.emit('notes', {notes, clientId: socket.id})
	})

	socket.on('disconnect', () => {
		logger.log(`client disconnected: ${socket.id}`)
		clients.remove(socket.id)
		sendClients()
	})
})

let nextId = 1

const engine: any = io.engine

engine.generateId = () => {
	return animal.getId() + '-' + nextId++
}

function sendClients() {
	logger.debug('sending clients info to all clients')
	io.local.emit('clients', {
		clients: clients.toArray(),
	})
}

const port = 80

server.listen(port)

logger.log('listening on port', port)
