const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)



app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.use(express.static('public'))

let clients = {}

io.on('connection', (socket) => {
	clients[socket.id] = {}

	io.local.emit('clients', {
		clients: Object.keys(clients).map(x => ({id: x}))
	})

	socket.on('note', (data) => {
		console.log(`client: ${socket.id} | ${data.frequency}`)
	})

	socket.on('disconnect', () => {
		delete clients[socket.id]
		console.log(`disconnect: ${socket.id}`)
	})
})

const port = 80

server.listen(port)

console.log('listening on port', port)
