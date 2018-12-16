import * as animal from 'animal-id'
import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {maxRoomNameLength} from '../common/common-constants'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllInstruments, selectInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {selectAllMessages, setChat} from '../common/redux/chat-redux'
import {IClientAppState} from '../common/redux/client-store'
import {
	addClient, clientDisconnected, ClientState, IClientState, maxUsernameLength,
	selectAllClients, selectClientBySocketId, SET_CLIENT_POINTER, setClients,
} from '../common/redux/clients-redux'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {
	roomAction, selectAllRoomNames, selectAllRoomStates,
	selectAllRoomStatesAsArray, selectRoomExists, selectRoomStateByName,
} from '../common/redux/room-stores-redux'
import {
	CHANGE_ROOM, CREATE_ROOM, createRoom, deleteRoom, selectAllRooms, setActiveRoom, setRooms,
} from '../common/redux/rooms-redux'
import {selectAllTracks, updateTracks} from '../common/redux/tracks-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'
import {IServerState} from './configure-server-store'
import {createServerStuff} from './create-server-stuff'

export const lobby = 'lobby'

const server = 'server'

export function setupServerWebSocketListeners(io: Server, serverStore: Store) {
	setInterval(() => {
		const ioRoomNames = Object.keys(io.sockets.adapter.rooms)

		const reduxRooms = selectAllRoomNames(serverStore.getState())

		const emptyRooms = reduxRooms.filter(x => ioRoomNames.includes(x) === false && x !== lobby)

		emptyRooms.forEach(x => serverStore.dispatch(deleteRoom(x)))

		if (emptyRooms.length > 0) {
			logger.log('deleting empty rooms: ', emptyRooms)

			io.local.emit(WebSocketEvent.broadcast, {
				...setRooms(selectAllRooms(serverStore.getState())),
				alreadyBroadcasted: true,
				source: 'server',
			})
		}
	}, 5000)

	io.on('connection', socket => {
		const newConnectionUsername = socket.handshake.query.username
			.replace(/ +(?= )/g, '')
			.trim()
			.substring(0, maxUsernameLength)

		const newConnectionRoom = getRoomName(socket.handshake.query.room)

		logger.log(
			`new connection | socketId: '${socket.id}' | username: '${newConnectionUsername}' | room: '${newConnectionRoom}'`,
		)

		registerCallBacks()

		joinOrCreateRoom(newConnectionRoom || lobby, new ClientState({socketId: socket.id, name: newConnectionUsername}))

		function getRoomName(roomQueryString: string) {
			try {
				return decodeURIComponent(roomQueryString.replace(/^\//, ''))
					.replace(/ +(?= )/g, '')
					.trim()
					.substring(0, maxRoomNameLength)
			} catch (error) {
				logger.warn('failed to parse room name: ', error)
				return ''
			}
		}

		function registerCallBacks() {
			socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
				if (action.type !== SET_CLIENT_POINTER) {
					logger.debug(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				}
				if (action[BROADCASTER_ACTION]) {
					serverStore.dispatch(roomAction(action, getRoom(socket)))
				}
				socket.broadcast.to(getRoom(socket)).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.debug(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)

				serverStore.dispatch(roomAction(action, getRoom(socket)))

				if (action.type === CHANGE_ROOM) {
					changeRooms(action.room)
				}

				if (action.type === CREATE_ROOM) {
					makeAndJoinNewRoom(animal.getId())
				}
			})

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)

				const serverState = serverStore.getState()
				const roomStates = selectAllRoomStates(serverState)
				const roomStoresArray = selectAllRoomStatesAsArray(serverState)

				const roomStoreIndex = roomStoresArray
					.findIndex(x => selectAllClients(x).some(y => y.socketId === socket.id))

				onLeaveRoom(
					io, socket, Object.keys(roomStates)[roomStoreIndex], serverStore,
				)

				logger.log(`done cleaning: ${socket.id}`)
			})
		}

		function joinOrCreateRoom(newRoom: string, client: IClientState) {
			socket.join(newRoom, err => {
				if (err) throw new Error(err)

				const roomExists = selectRoomExists(serverStore.getState(), newRoom)

				// Do this check after joining the socket to the room, that way the room can't get deleted anymore
				if (roomExists === false) {
					makeNewRoom(newRoom)
				}

				onJoinRoom(io, socket, newRoom, serverStore, client)
			})
		}

		function changeRooms(newRoom: string) {
			const roomToLeave = getRoom(socket)

			if (roomToLeave === newRoom) return

			const client = selectClientBySocketId(
				selectRoomStateByName(serverStore.getState(), roomToLeave), socket.id,
			)

			socket.leave(roomToLeave)

			onLeaveRoom(io, socket, roomToLeave, serverStore)

			socket.join(newRoom, err => {
				if (err) throw new Error(err)

				const roomExists = selectRoomExists(serverStore.getState(), newRoom)

				// Do this check after joining the socket to the room, that way the room can't get deleted anymore
				if (roomExists === false) {
					makeNewRoom(newRoom)
				}

				onJoinRoom(io, socket, newRoom, serverStore, client)
			})
		}

		function makeAndJoinNewRoom(newRoomName: string) {
			if (selectRoomExists(serverStore.getState(), newRoomName) === false) {
				makeNewRoom(newRoomName)
			}

			changeRooms(newRoomName)
		}

		function makeNewRoom(newRoomName: string) {
			if (selectRoomExists(serverStore.getState(), newRoomName)) {
				throw new Error(`room exists, this shouldn't happen`)
			} else {
				serverStore.dispatch(createRoom(newRoomName))
				createServerStuff(newRoomName, serverStore)

				io.local.emit(WebSocketEvent.broadcast, {
					...setRooms(selectAllRooms(serverStore.getState())),
					alreadyBroadcasted: true,
					source: server,
				})
			}
		}
	})
}

function onJoinRoom(io, socket, room: string, serverStore: Store, client: IClientState) {
	syncState(socket, selectRoomStateByName(serverStore.getState(), room), serverStore.getState(), getRoom(socket))

	const addClientAction = addClient(client)
	serverStore.dispatch(roomAction(addClientAction, room))
	io.to(getRoom(socket)).emit(WebSocketEvent.broadcast, addClientAction)
}

function onLeaveRoom(io, socket, roomToLeave: string, serverStore: Store) {
	const roomState: IClientAppState = selectRoomStateByName(serverStore.getState(), roomToLeave)
	const clientId = selectClientBySocketId(roomState, socket.id).id

	const instrumentIdsToDelete = selectInstrumentsByOwner(roomState, clientId).map(x => x.id)
	const keyboardIdsToDelete = selectVirtualKeyboardsByOwner(roomState, clientId).map(x => x.id)

	const sourceAndTargetIds = instrumentIdsToDelete.concat(keyboardIdsToDelete)
	const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(roomState, sourceAndTargetIds).map(x => x.id)
	const deleteConnectionsAction = deleteConnections(connectionIdsToDelete)
	serverStore.dispatch(roomAction(deleteConnectionsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

	const deleteBasicInstrumentsAction = deleteBasicInstruments(instrumentIdsToDelete)
	serverStore.dispatch(roomAction(deleteBasicInstrumentsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteBasicInstrumentsAction)

	const deleteVirtualKeyboardsAction = deleteVirtualKeyboards(keyboardIdsToDelete)
	serverStore.dispatch(roomAction(deleteVirtualKeyboardsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteVirtualKeyboardsAction)

	const clientDisconnectedAction = clientDisconnected(clientId)
	serverStore.dispatch(roomAction(clientDisconnectedAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, clientDisconnectedAction)
}

function syncState(newClientSocket: Socket, roomState: IClientAppState, serverState: IServerState, activeRoom: string) {
	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setRooms(selectAllRooms(serverState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setActiveRoom(activeRoom),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setClients(selectAllClients(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setChat(selectAllMessages(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateBasicInstruments(selectAllInstruments(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateVirtualKeyboards(selectAllVirtualKeyboards(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateTracks(selectAllTracks(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateConnections(selectAllConnections(roomState)),
		alreadyBroadcasted: true,
		source: server,
	})
}

function getRoom(socket: Socket) {
	return Object.keys(socket.rooms)[1]
}
