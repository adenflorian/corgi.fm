import * as animal from 'animal-id'
import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {actionsBlacklist, maxRoomNameLength} from '../common/common-constants'
import {ClientId} from '../common/common-types'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllBasicInstruments, selectBasicInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {
	deleteBasicSamplers, selectAllSamplers, selectSamplersByOwner, updateBasicSamplers,
} from '../common/redux/basic-sampler-redux'
import {selectAllMessages, setChat} from '../common/redux/chat-redux'
import {
	addClient, clientDisconnected, ClientState, maxUsernameLength,
	selectAllClients, selectClientBySocketId, setClients,
} from '../common/redux/clients-redux'
import {IClientRoomState} from '../common/redux/common-redux-types'
import {IServerState} from '../common/redux/configure-server-store'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {selectAllGridSequencers, updateGridSequencers} from '../common/redux/grid-sequencers-redux'
import {selectAllInfiniteSequencers, updateInfiniteSequencers} from '../common/redux/infinite-sequencers-redux'
import {
	deletePositions, selectAllPositions, selectPositionsWithTargetIds, updatePositions,
} from '../common/redux/positions-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {
	addRoomMember, deleteRoomMember, selectAllRoomMemberIds, selectRoomMemberState, setRoomMembers,
} from '../common/redux/room-members-redux'
import {
	createRoomAction, selectAllRoomStates, selectRoomStateByName,
} from '../common/redux/room-stores-redux'
import {
	CHANGE_ROOM, createRoom, deleteRoom, REQUEST_CREATE_ROOM,
	selectAllRoomNames, selectRoomExists, setActiveRoom, setRooms,
} from '../common/redux/rooms-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'
import {createServerStuff} from './create-server-stuff'

export const lobby = 'lobby'

const server = 'server'

export function setupServerWebSocketListeners(io: Server, serverStore: Store) {
	setInterval(() => {
		const ioRoomNames = Object.keys(io.sockets.adapter.rooms)

		const reduxRooms = selectAllRoomNames(serverStore.getState())

		const emptyRooms = reduxRooms.filter(x => ioRoomNames.includes(x) === false && x !== lobby)

		emptyRooms.forEach(x => serverStore.dispatch(deleteRoom(x)))

		if (emptyRooms.count() > 0) {
			logger.log('deleting empty rooms: ', emptyRooms)

			io.local.emit(WebSocketEvent.broadcast, {
				...setRooms(selectAllRoomNames(serverStore.getState())),
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

		const newClient = new ClientState({socketId: socket.id, name: newConnectionUsername})

		joinOrCreateRoom(newConnectionRoom || lobby, newClient.id)

		const addClientAction = addClient(newClient)
		serverStore.dispatch(addClientAction)
		io.local.emit(WebSocketEvent.broadcast, addClientAction)

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
				if (actionsBlacklist.includes(action.type) === false) {
					logger.trace(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				}
				if (action[BROADCASTER_ACTION]) {
					serverStore.dispatch(createRoomAction(action, getRoom(socket)))
				}
				socket.broadcast.to(getRoom(socket)).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.trace(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)

				serverStore.dispatch(createRoomAction(action, getRoom(socket)))

				if (action.type === CHANGE_ROOM) {
					changeRooms(action.room)
				}

				if (action.type === REQUEST_CREATE_ROOM) {
					makeAndJoinNewRoom(animal.getId())
				}
			})

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)

				const serverState = serverStore.getState()
				const roomStates = selectAllRoomStates(serverState)

				const clientId = selectClientBySocketId(serverState, socket.id).id

				const roomToLeave = roomStates.findKey(x => selectAllRoomMemberIds(x).includes(clientId))

				if (roomToLeave) {
					onLeaveRoom(
						io, socket, roomToLeave, serverStore,
					)
				} else {
					logger.warn('hmm')
				}

				const clientDisconnectedAction = clientDisconnected(clientId)
				serverStore.dispatch(clientDisconnectedAction)
				io.local.emit(WebSocketEvent.broadcast, clientDisconnectedAction)

				logger.log(`done cleaning: ${socket.id}`)
			})
		}

		function joinOrCreateRoom(newRoom: string, clientId: ClientId) {
			socket.join(newRoom, err => {
				if (err) throw new Error(err)

				const roomExists = selectRoomExists(serverStore.getState(), newRoom)

				// Do this check after joining the socket to the room, that way the room can't get deleted anymore
				if (roomExists === false) {
					makeNewRoom(newRoom)
				}

				onJoinRoom(io, socket, newRoom, serverStore, clientId)
			})
		}

		function changeRooms(newRoom: string) {
			const roomToLeave = getRoom(socket)

			if (roomToLeave === newRoom) return

			socket.leave(roomToLeave)

			onLeaveRoom(io, socket, roomToLeave, serverStore)

			socket.join(newRoom, err => {
				if (err) throw new Error(err)

				const roomExists = selectRoomExists(serverStore.getState(), newRoom)

				// Do this check after joining the socket to the room, that way the room can't get deleted anymore
				if (roomExists === false) {
					makeNewRoom(newRoom)
				}

				onJoinRoom(io, socket, newRoom, serverStore, selectClientBySocketId(serverStore.getState(), socket.id).id)
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
					...setRooms(selectAllRoomNames(serverStore.getState())),
					alreadyBroadcasted: true,
					source: server,
				})
			}
		}
	})
}

function onJoinRoom(io: Server, socket: Socket, room: string, serverStore: Store, clientId: ClientId) {
	const roomState = selectRoomStateByName(serverStore.getState(), room)
	if (!roomState) return logger.warn(`onJoinRoom-couldn't find room state`)
	syncState(socket, roomState, serverStore.getState(), getRoom(socket))

	const addRoomMemberAction = addRoomMember(clientId)
	serverStore.dispatch(createRoomAction(addRoomMemberAction, room))
	io.to(getRoom(socket)).emit(WebSocketEvent.broadcast, addRoomMemberAction)
}

function onLeaveRoom(io: Server, socket: Socket, roomToLeave: string, serverStore: Store<IServerState>) {
	const roomState = selectRoomStateByName(serverStore.getState(), roomToLeave)
	if (!roomState) return logger.warn(`onLeaveRoom-couldn't find room state: roomToLeave: ${roomToLeave}`)
	const clientId = selectClientBySocketId(serverStore.getState(), socket.id).id

	const instrumentIdsToDelete = selectBasicInstrumentsByOwner(roomState, clientId).map(x => x.id)
	const samplerIdsToDelete = selectSamplersByOwner(roomState, clientId).map(x => x.id)
	const keyboardIdsToDelete = selectVirtualKeyboardsByOwner(roomState, clientId).map(x => x.id)

	const sourceAndTargetIds = instrumentIdsToDelete.concat(keyboardIdsToDelete).concat(samplerIdsToDelete)
	const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(roomState, sourceAndTargetIds).map(x => x.id)
	const deleteConnectionsAction = deleteConnections(connectionIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteConnectionsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

	const positionIdsToDelete = selectPositionsWithTargetIds(roomState, sourceAndTargetIds).map(x => x.id)
	const deletePositionsAction = deletePositions(positionIdsToDelete)
	serverStore.dispatch(createRoomAction(deletePositionsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePositionsAction)

	const deleteBasicInstrumentsAction = deleteBasicInstruments(instrumentIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteBasicInstrumentsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteBasicInstrumentsAction)

	const deleteBasicSamplersAction = deleteBasicSamplers(samplerIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteBasicSamplersAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteBasicSamplersAction)

	const deleteVirtualKeyboardsAction = deleteVirtualKeyboards(keyboardIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteVirtualKeyboardsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteVirtualKeyboardsAction)

	const deleteRoomMemberAction = deleteRoomMember(clientId)
	serverStore.dispatch(createRoomAction(deleteRoomMemberAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteRoomMemberAction)
}

function syncState(newSocket: Socket, roomState: IClientRoomState, serverState: IServerState, activeRoom: string) {
	newSocket.emit(WebSocketEvent.broadcast, {
		...setRooms(selectAllRoomNames(serverState)),
		alreadyBroadcasted: true,
		source: server,
	})

	newSocket.emit(WebSocketEvent.broadcast, {
		...setActiveRoom(activeRoom),
		alreadyBroadcasted: true,
		source: server,
	})

	newSocket.emit(WebSocketEvent.broadcast, {
		...setClients(selectAllClients(serverState)),
		alreadyBroadcasted: true,
		source: server,
	})

	const foo = [
		[setRoomMembers, selectAllRoomMemberIds],
		[setChat, selectAllMessages],
		[updateBasicInstruments, selectAllBasicInstruments],
		[updateBasicSamplers, selectAllSamplers],
		[updateVirtualKeyboards, selectAllVirtualKeyboards],
		[updateGridSequencers, selectAllGridSequencers],
		[updateInfiniteSequencers, selectAllInfiniteSequencers],
		[updateConnections, selectAllConnections],
		[updatePositions, selectAllPositions],
	]

	foo.forEach(([actionCreator, selector]: any[]) => {
		newSocket.emit(WebSocketEvent.broadcast, {
			...actionCreator(selector(roomState)),
			alreadyBroadcasted: true,
			source: server,
		})
	})
}

function getRoom(socket: Socket) {
	return Object.keys(socket.rooms)[1]
}
