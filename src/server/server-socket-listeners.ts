import * as animal from 'animal-id'
import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllInstruments, selectInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {
	addClient, clientDisconnected, ClientState, IClientState, selectAllClients,
	selectClientBySocketId, SET_CLIENT_POINTER, setClients,
} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {selectAllRoomStores, selectAllRoomStoresAsArray, selectRoomStoreByName} from '../common/redux/room-stores-redux'
import {
	CHANGE_ROOM, CREATE_ROOM, createRoom, selectAllRooms, setActiveRoom, setRooms,
} from '../common/redux/rooms-redux'
import {selectAllTracks, updateTracks} from '../common/redux/tracks-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'
import {createServerStuff} from './create-server-stuff'

export const lobby = 'lobby'

export function setupServerWebSocketListeners(io: Server, serverStore: Store) {
	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		socket.join(lobby, err => {
			if (err) throw new Error(err)

			onJoinRoom(io, socket, selectRoomStoreByName(serverStore.getState(), getRoom(socket)),
				serverStore, new ClientState(socket.id))

			socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
				if (action.type !== SET_CLIENT_POINTER) {
					logger.debug(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				}
				if (action[BROADCASTER_ACTION]) {
					selectRoomStoreByName(serverStore.getState(), getRoom(socket)).dispatch(action)
				}
				socket.broadcast.to(getRoom(socket)).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.debug(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)
				selectRoomStoreByName(serverStore.getState(), getRoom(socket)).dispatch(action)

				if (action.type === CHANGE_ROOM) {
					changeRooms(action.room)
				}

				if (action.type === CREATE_ROOM) {
					const newRoomName = animal.getId()

					const existingRoomNames = selectAllRooms(serverStore.getState())

					if (existingRoomNames.includes(newRoomName)) {
						changeRooms(newRoomName)
					} else {
						serverStore.dispatch(createRoom(newRoomName))
						createServerStuff(selectRoomStoreByName(serverStore.getState(), newRoomName).dispatch)

						io.local.emit(WebSocketEvent.broadcast, {
							...setRooms(selectAllRooms(serverStore.getState())),
							alreadyBroadcasted: true,
							source: server,
						})

						changeRooms(newRoomName)
					}
				}
			})

			function changeRooms(newRoom: string) {
				const roomToLeave = getRoom(socket)

				if (roomToLeave === newRoom) return

				const client = selectClientBySocketId(
					selectRoomStoreByName(serverStore.getState(), roomToLeave).getState(), socket.id,
				)

				socket.leave(roomToLeave)

				onLeaveRoom(io, socket, selectRoomStoreByName(serverStore.getState(), roomToLeave), roomToLeave)

				socket.join(newRoom, err2 => {
					if (err2) throw new Error(err2)

					onJoinRoom(io, socket, selectRoomStoreByName(serverStore.getState(), newRoom), serverStore, client)
				})
			}

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)

				const serverState = serverStore.getState()
				const roomStores = selectAllRoomStores(serverState)
				const roomStoresArray: Store[] = selectAllRoomStoresAsArray(serverState)

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

function onJoinRoom(io, socket, roomStore, serverStore, client: IClientState) {
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
