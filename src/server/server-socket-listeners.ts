import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllInstruments, selectInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {
	addClient, clientDisconnected, ClientState, IClientState, selectAllClients, selectClientBySocketId, SET_CLIENT_POINTER, setClients,
} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {CHANGE_ROOM, selectAllRooms, setActiveRoom, setRooms} from '../common/redux/rooms-redux'
import {selectAllTracks, updateTracks} from '../common/redux/tracks-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'

// const defaultRoom = 'lobby'
export const roomA = 'A'
export const roomB = 'B'

let flag = false

export function setupServerWebSocketListeners(io: Server, serverStore: Store, roomStores: any) {

	serverStore.dispatch(setRooms([roomA, roomB]))

	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		flag = !flag

		const roomToJoin = flag ? roomA : roomB

		socket.join(roomToJoin, err => {
			if (err) throw new Error(err)

			onJoinRoom(io, socket, roomStores[getRoom(socket)], roomStores, serverStore, new ClientState(socket.id))

			socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
				if (action.type !== SET_CLIENT_POINTER) {
					logger.debug(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				}
				if (action[BROADCASTER_ACTION]) {
					roomStores[getRoom(socket)].dispatch(action)
				}
				socket.broadcast.to(getRoom(socket)).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.debug(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)
				roomStores[getRoom(socket)].dispatch(action)

				const newRoom = action.room

				if (action.type === CHANGE_ROOM) {

					const roomToLeave = getRoom(socket)

					if (roomToLeave === newRoom) {
						throw new Error('UHOH')
					}
					const client2 = selectClientBySocketId(roomStores[roomToLeave].getState(), socket.id)

					socket.leave(roomToLeave)

					onLeaveRoom(io, socket, roomStores[roomToLeave], roomToLeave)

					socket.join(newRoom, err2 => {
						if (err2) throw new Error(err2)

						onJoinRoom(io, socket, roomStores[newRoom], roomStores, serverStore, client2)
					})
				}
			})

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)

				const roomStoresArray: Store[] = Object.keys(roomStores).map(x => roomStores[x])

				const roomStoreIndex = roomStoresArray
					.findIndex(x => selectAllClients(x.getState()).some(y => y.socketId === socket.id))

				onLeaveRoom(
					io, socket, roomStores[Object.keys(roomStores)[roomStoreIndex]], Object.keys(roomStores)[roomStoreIndex])

				logger.log(`done cleaning: ${socket.id}`)
			})
		})
	})
}

const server = 'server'

function onJoinRoom(io, socket, roomStore, roomStores, serverStore, client: IClientState) {
	syncState(socket, roomStore, serverStore, getRoom(socket))

	const addClientAction = addClient(client)
	roomStore.dispatch(addClientAction)
	io.to(getRoom(socket)).emit(WebSocketEvent.broadcast, addClientAction)
}

function onLeaveRoom(io, socket, roomStore, roomToLeave) {
	const state: IAppState = roomStore.getState()
	const clientId = selectClientBySocketId(state, socket.id).id

	const clientDisconnectedAction = clientDisconnected(clientId)
	roomStore.dispatch(clientDisconnectedAction)
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, clientDisconnectedAction)

	const instrumentIdsToDelete = selectInstrumentsByOwner(state, clientId).map(x => x.id)
	const keyboardIdsToDelete = selectVirtualKeyboardsByOwner(state, clientId).map(x => x.id)

	const sourceAndTargetIds = instrumentIdsToDelete.concat(keyboardIdsToDelete)
	const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(state, sourceAndTargetIds).map(x => x.id)
	const deleteConnectionsAction = deleteConnections(connectionIdsToDelete)
	roomStore.dispatch(deleteConnectionsAction)
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

	const deleteBasicInstrumentsAction = deleteBasicInstruments(instrumentIdsToDelete)
	roomStore.dispatch(deleteBasicInstrumentsAction)
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteBasicInstrumentsAction)

	const deleteVirtualKeyboardsAction = deleteVirtualKeyboards(keyboardIdsToDelete)
	roomStore.dispatch(deleteVirtualKeyboardsAction)
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteVirtualKeyboardsAction)
}

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

function getRoom(socket: Socket) {
	return Object.keys(socket.rooms)[1]
}
