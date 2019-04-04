import * as animal from 'animal-id'
import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {maxRoomNameLength} from '../common/common-constants'
import {ClientId} from '../common/common-types'
import {logger} from '../common/logger'
import {
	addClient, addRoomMember, BroadcastAction, CHANGE_ROOM,
	clientDisconnected, ClientState, connectionsActions, createRoom,
	createRoomAction, deletePositions, deleteRoom, deleteRoomMember,
	deleteThingsAny, getActionsBlacklist, globalClockActions,
	IClientRoomState, IServerState, maxUsernameLength, pointersActions,
	ready, REQUEST_CREATE_ROOM, selectAllClients, selectAllConnections,
	selectAllMessages, selectAllPointers, selectAllPositions,
	selectAllRoomMemberIds, selectAllRoomNames, selectAllRoomStates,
	selectClientBySocketId, selectConnectionsWithSourceOrTargetIds,
	selectGlobalClockState, selectNodeIdsOwnedByClient,
	selectPositionsWithIds, selectRoomExists, selectRoomStateByName,
	selectShamuGraphState, setActiveRoom, setChat, setClients,
	setRoomMembers, setRooms, shamuGraphActions, updatePositions,
	SERVER_ACTION, GLOBAL_SERVER_ACTION
} from '../common/redux'
import {WebSocketEvent} from '../common/server-constants'
import {createServerStuff} from './create-server-stuff'
import {serverInfo} from './server-info'

export const lobby = 'lobby'

const server = 'server'

const version = serverInfo.version

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
		socket.emit('version', version)

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
				if (getActionsBlacklist().includes(action.type) === false) {
					logger.trace(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
				}

				if (action[GLOBAL_SERVER_ACTION]) {
					serverStore.dispatch(action)
				} else if (action[SERVER_ACTION]) {
					serverStore.dispatch(createRoomAction(action, getRoom(socket)))
				}

				socket.broadcast.to(getRoom(socket)).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			// TODO Merge with broadcast event above
			socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
				logger.trace(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)

				if (action[GLOBAL_SERVER_ACTION]) {
					serverStore.dispatch(action)
				} else if (action[SERVER_ACTION]) {
					serverStore.dispatch(createRoomAction(action, getRoom(socket)))
				}

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

/** When a user leaves a room, tell all the other room members to delete that user's things */
function onLeaveRoom(io: Server, socket: Socket, roomToLeave: string, serverStore: Store<IServerState>) {
	const roomState = selectRoomStateByName(serverStore.getState(), roomToLeave)
	if (!roomState) return logger.warn(`onLeaveRoom-couldn't find room state: roomToLeave: ${roomToLeave}`)
	const clientId = selectClientBySocketId(serverStore.getState(), socket.id).id

	{
		const nodeIdsOwnedByClient = selectNodeIdsOwnedByClient(roomState, clientId)
		const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(roomState, nodeIdsOwnedByClient)
			.map(x => x.id)
			.toList()
		const deleteConnectionsAction = connectionsActions.delete(connectionIdsToDelete)
		serverStore.dispatch(createRoomAction(deleteConnectionsAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

		const positionIdsToDelete = selectPositionsWithIds(roomState, nodeIdsOwnedByClient).map(x => x.id)
		const deletePositionsAction = deletePositions(positionIdsToDelete)
		serverStore.dispatch(createRoomAction(deletePositionsAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePositionsAction)

		const deleteNodes = deleteThingsAny(nodeIdsOwnedByClient)
		serverStore.dispatch(createRoomAction(deleteNodes, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteNodes)

		const deletePointer = pointersActions.delete(clientId)
		serverStore.dispatch(createRoomAction(deletePointer, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePointer)
	}

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

	const updaters = [
		[pointersActions.replaceAll, selectAllPointers],
		[setRoomMembers, selectAllRoomMemberIds],
		[setChat, selectAllMessages],
		[connectionsActions.updateAll, selectAllConnections],
		[updatePositions, selectAllPositions],
		[shamuGraphActions.replace, selectShamuGraphState],
		[globalClockActions.replace, selectGlobalClockState],
	]

	updaters.forEach(([actionCreator, selector]: any[]) => {
		const action = {
			...actionCreator(selector(roomState)),
			alreadyBroadcasted: true,
			source: server,
		}
		newSocket.emit(WebSocketEvent.broadcast, action)
		logger.trace(`SYNC: `, action)
	})

	newSocket.emit(WebSocketEvent.broadcast, {
		...ready(),
		alreadyBroadcasted: true,
		source: server,
	})
}

// TODO Will break once supporting multiple rooms at once
function getRoom(socket: Socket) {
	const realRooms = Object.keys(socket.rooms).filter(x => x !== socket.id)
	return realRooms[0]
}
