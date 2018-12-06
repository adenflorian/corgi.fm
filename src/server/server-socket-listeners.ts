import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllInstruments, selectInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {
	addClient, clientDisconnected, ClientState, selectAllClients, selectClientBySocketId, setClients,
} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {selectAllRooms, setActiveRoom, setRooms} from '../common/redux/rooms-redux'
import {selectAllTracks, updateTracks} from '../common/redux/tracks-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'

// const defaultRoom = 'lobby'
const roomA = 'roomA'
const roomB = 'roomB'

let flag = false

export function setupServerWebSocketListeners(io: Server, serverStore: Store, roomStores: any) {

	serverStore.dispatch(setRooms([roomA, roomB]))

	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		flag = !flag

		const roomToJoin = flag ? roomA : roomB

		socket.join(roomToJoin, err => {
			if (err) throw new Error(err)
			io.to(roomToJoin).emit('a new user has joined the room') // broadcast to everyone in the room

			const addClientAction = addClient(new ClientState(socket.id))
			roomStores[roomToJoin].dispatch(addClientAction)
			io.to(roomToJoin).emit(WebSocketEvent.broadcast, addClientAction)

			syncState(socket, roomStores[roomToJoin], serverStore, roomToJoin)

			socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
				logger.debug(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				if (action[BROADCASTER_ACTION]) {
					roomStores[roomToJoin].dispatch(action)
				}
				socket.broadcast.to(roomToJoin).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.debug(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)
				roomStores[roomToJoin].dispatch(action)
			})

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)
				const state: IAppState = roomStores[roomToJoin].getState()
				const clientId = selectClientBySocketId(state, socket.id).id

				const clientDisconnectedAction = clientDisconnected(clientId)
				roomStores[roomToJoin].dispatch(clientDisconnectedAction)
				io.to(roomToJoin).emit(WebSocketEvent.broadcast, clientDisconnectedAction)

				const instrumentIdsToDelete = selectInstrumentsByOwner(state, clientId).map(x => x.id)
				const keyboardIdsToDelete = selectVirtualKeyboardsByOwner(state, clientId).map(x => x.id)

				const sourceAndTargetIds = instrumentIdsToDelete.concat(keyboardIdsToDelete)
				const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(state, sourceAndTargetIds).map(x => x.id)
				const deleteConnectionsAction = deleteConnections(connectionIdsToDelete)
				roomStores[roomToJoin].dispatch(deleteConnectionsAction)
				io.to(roomToJoin).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

				const deleteBasicInstrumentsAction = deleteBasicInstruments(instrumentIdsToDelete)
				roomStores[roomToJoin].dispatch(deleteBasicInstrumentsAction)
				io.to(roomToJoin).emit(WebSocketEvent.broadcast, deleteBasicInstrumentsAction)

				const deleteVirtualKeyboardsAction = deleteVirtualKeyboards(keyboardIdsToDelete)
				roomStores[roomToJoin].dispatch(deleteVirtualKeyboardsAction)
				io.to(roomToJoin).emit(WebSocketEvent.broadcast, deleteVirtualKeyboardsAction)

				logger.log(`done cleaning: ${socket.id}`)
			})
		})

	})
}

const server = 'server'

function syncState(newClientSocket: Socket, store: Store, serverStore: Store, activeRoom: string) {
	const state: IAppState = store.getState()

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setRooms(selectAllRooms(serverStore.getState())),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setActiveRoom(activeRoom),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setClients(selectAllClients(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateBasicInstruments(selectAllInstruments(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateVirtualKeyboards(selectAllVirtualKeyboards(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateTracks(selectAllTracks(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateConnections(selectAllConnections(state)),
		alreadyBroadcasted: true,
		source: server,
	})
}
