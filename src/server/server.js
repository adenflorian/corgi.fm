const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const {logger} = require('./logger')
const {Clients} = require('./Clients')

const app = express()
const server = http.Server(app)
const io = socketIO(server)

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.use(express.static('src/client'))

const clients = new Clients()

io.on('connection', (socket) => {
	logger.log('new connection | ', socket.id)

	clients.add(socket.id)

	sendClients()

	socket.on('note', (data) => {
		logger.log(`client: ${socket.id} | ${data.frequency}`)
		socket.broadcast.emit('note', {...data, clientId: socket.id})
	})

	socket.on('disconnect', () => {
		logger.log(`client disconnected: ${socket.id}`)
		clients.remove(socket.id)
		sendClients()
	})
})

function sendClients() {
	logger.debug('sending clients info to all clients')
	io.local.emit('clients', {
		clients: clients.toArray()
	})
}

const port = 80

server.listen(port)

logger.log('listening on port', port)


