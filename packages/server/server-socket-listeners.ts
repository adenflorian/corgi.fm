import * as animal from 'animal-id'
import {stripIndents} from 'common-tags'
import {Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {
	lobby, maxRoomNameLength, serverClientId,
} from '@corgifm/common/common-constants'
import {ClientId, ConnectionNodeType} from '@corgifm/common/common-types'
import {logger} from '@corgifm/common/logger'
import {
	addClient, addRoomMember, BroadcastAction,
	CHANGE_ROOM, clientDisconnected, ClientState,
	connectionsActions, createRoom, createRoomAction,
	deletePositions, deleteRoomMember, deleteThingsAny,
	getActionsBlacklist, GLOBAL_SERVER_ACTION, globalClockActions,
	IClientRoomState,
	IServerState, LOAD_ROOM, maxUsernameLength, pointersActions, ready,
	replacePositions, REQUEST_CREATE_ROOM, roomOwnerRoomActions,
	RoomSettingsAction, roomSettingsActions, RoomsReduxAction, SavedRoom,
	selectAllClients, selectAllConnections,
	selectAllMessages, selectAllPointers, selectAllPositions,
	selectAllRoomMemberIds,
	selectAllRooms, selectAllRoomStates, selectClientById,
	selectClientBySocketId,
	selectConnectionsWithSourceOrTargetIds, selectConnectionsWithTargetIds,
	selectGlobalClockState, selectNodeIdsOwnedByClient,
	selectPositionsWithIds, selectRoomExists,
	selectRoomSettings, selectRoomStateByName, selectShamuGraphState,
	SERVER_ACTION, setActiveRoom,
	setChat, setClients, setRoomMembers, setRooms, shamuGraphActions,
	userLeftRoom, whitelistedRoomActionTypes,
} from '@corgifm/common/redux'
import {WebSocketEvent} from '@corgifm/common/server-constants'
import {createServerStuff, loadServerStuff} from './create-server-stuff'
import {DBStore} from './database/database'
import {getServerVersion} from './server-version'

const server = 'server'

const version = getServerVersion()

export function setupServerWebSocketListeners(
	io: Server, serverStore: Store, dbStore: DBStore,
) {
	io.on('connection', socket => {
		socket.emit('version', version)

		const username = socket.handshake.query.username
			.replace(/ +(?= )/g, '')
			.trim()
			.substring(0, maxUsernameLength)

		const room = getRoomName(socket.handshake.query.room)

		// Fire and forget, not worth waiting for
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		dbStore.events.saveUserConnectEventAsync({username, room, time: new Date()})

		logger.log(
			`new connection | socketId: '${socket.id}' | username: '${username}' | room: '${room}'`,
		)

		registerCallBacks()

		const newClient = new ClientState({socketId: socket.id, name: username})

		const clientId = newClient.id

		joinOrCreateRoom(room || lobby)

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

				const currentRoom = getRoom(socket)
				const roomState = selectRoomStateByName(serverStore.getState(), currentRoom)

				if (!roomState) {
					logger.error(`can't find room state on server for room ${currentRoom}`)
					return
				}

				// Don't allow non-whitelisted actions to be dispatch by non-owners when only owner can do stuff
				if (!whitelistedRoomActionTypes.includes(action.type) && selectRoomSettings(roomState).onlyOwnerCanDoStuff) {
					const roomOwnerId = getRoomOwnerId(serverStore, currentRoom)

					if (clientId !== roomOwnerId) {
						const client = selectClientById(serverStore.getState(), clientId)
						logger.warn(stripIndents`user attempted to run a room action while not room owner and room is locked.
							clientId: ${clientId} username: ${client.name} room: ${currentRoom} action: ${JSON.stringify(action, null, 2)}`)
						return
					}
				}

				if (roomOwnerRoomActions.includes(action.type)) {
					const roomOwnerId = getRoomOwnerId(serverStore, currentRoom)

					// Only do it if the current client is the current room owner
					if (clientId !== roomOwnerId) {
						const client = selectClientById(serverStore.getState(), clientId)
						logger.warn(stripIndents`user attempted to run a restricted room action while not room owner.
							clientId: ${clientId} username: ${client.name} room: ${currentRoom} action: ${JSON.stringify(action, null, 2)}`)
						return
					}

					// Assume client is room owner past this point
					serverStore.dispatch(createRoomAction(action, currentRoom))
				} else if (action[GLOBAL_SERVER_ACTION]) {
					serverStore.dispatch(action)
				} else if (action[SERVER_ACTION]) {
					serverStore.dispatch(createRoomAction(action, currentRoom))
				}

				socket.broadcast.to(currentRoom).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
			})

			// TODO Merge with broadcast event above
			socket.on(WebSocketEvent.serverAction, (action: RoomSettingsAction | RoomsReduxAction) => {
				logger.trace(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)

				const currentRoom = getRoom(socket)

				const isRestrictedRoomAction = roomOwnerRoomActions.includes(action.type)

				if (isRestrictedRoomAction) {
					const client = selectClientById(serverStore.getState(), clientId)
					logger.warn(stripIndents`user attempted to run a restricted room action as a server only action.
						clientId: ${clientId} username: ${client.name} room: ${currentRoom} action: ${JSON.stringify(action, null, 2)}`)
					return
				}

				if (action.type === CHANGE_ROOM) {
					changeRooms(action.room)
				} else if (action.type === REQUEST_CREATE_ROOM) {
					makeAndJoinNewRoom(animal.getId())
				} else if (action.type === LOAD_ROOM) {
					makeAndJoinNewRoom(animal.getId(), action.savedRoom)
				} else if ((action as any)[GLOBAL_SERVER_ACTION]) {
					serverStore.dispatch(action)
				} else if ((action as any)[SERVER_ACTION]) {
					serverStore.dispatch(createRoomAction(action, currentRoom))
				}
			})

			socket.on('disconnect', () => {
				logger.log(`client disconnected: ${socket.id}`)

				const serverState = serverStore.getState()
				const roomStates = selectAllRoomStates(serverState)

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
			})
		}

		function joinOrCreateRoom(newRoom: string) {
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

		function makeAndJoinNewRoom(newRoomName: string, roomDataToLoad?: SavedRoom) {
			if (selectRoomExists(serverStore.getState(), newRoomName) === false) {
				makeNewRoom(newRoomName, roomDataToLoad)
			}

			changeRooms(newRoomName)
		}

		function makeNewRoom(newRoomName: string, roomDataToLoad?: SavedRoom) {
			if (selectRoomExists(serverStore.getState(), newRoomName)) {
				throw new Error(`room exists, this shouldn't happen`)
			} else {
				serverStore.dispatch(createRoom(newRoomName, Date.now()))
				serverStore.dispatch(createRoomAction(roomSettingsActions.setOwner(clientId), newRoomName))

				if (roomDataToLoad) {
					loadServerStuff(newRoomName, serverStore, roomDataToLoad)
				} else {
					createServerStuff(newRoomName, serverStore)
				}

				io.local.emit(WebSocketEvent.broadcast, {
					...setRooms(selectAllRooms(serverStore.getState())),
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

	serverStore.dispatch(userLeftRoom(roomToLeave, Date.now()))

	{
		const nodesOwnedByClient = selectNodeIdsOwnedByClient(roomState, clientId)

		// filter out nodes that we don't want to delete

		const keyboardIds = nodesOwnedByClient
			.filter(x => x.type === ConnectionNodeType.virtualKeyboard)
			.map(x => x.id)

		const otherNodes = nodesOwnedByClient
			.filter(x => x.type !== ConnectionNodeType.virtualKeyboard)
			.filter(x => {
				const incomingConnections = selectConnectionsWithTargetIds(roomState, [x.id])

				// return true if it has no incoming connections
				if (incomingConnections.count() === 0) return true

				// return true if all incoming connections are from owner's keyboards
				if (incomingConnections.every(y => keyboardIds.includes(y.sourceId))) return true

				return false
			})

		const nodeIdsToDelete = otherNodes.map(x => x.id).concat(keyboardIds)

		const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(roomState, nodeIdsToDelete)
			.map(x => x.id)
			.toList()
		const deleteConnectionsAction = connectionsActions.delete(connectionIdsToDelete)
		serverStore.dispatch(createRoomAction(deleteConnectionsAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

		const positionIdsToDelete = selectPositionsWithIds(roomState, nodeIdsToDelete).map(x => x.id)
		const deletePositionsAction = deletePositions(positionIdsToDelete)
		serverStore.dispatch(createRoomAction(deletePositionsAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePositionsAction)

		const deleteNodes = deleteThingsAny(nodeIdsToDelete)
		serverStore.dispatch(createRoomAction(deleteNodes, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteNodes)

		const deletePointer = pointersActions.delete(clientId)
		serverStore.dispatch(createRoomAction(deletePointer, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePointer)
	}

	const deleteRoomMemberAction = deleteRoomMember(clientId)
	serverStore.dispatch(createRoomAction(deleteRoomMemberAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteRoomMemberAction)

	// Select new room owner if needed
	const currentRoomOwnerId = getRoomOwnerId(serverStore, roomToLeave)
	if (clientId === currentRoomOwnerId) {
		const setRoomOwnerAction = roomSettingsActions.setOwner(serverClientId)
		serverStore.dispatch(createRoomAction(setRoomOwnerAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, setRoomOwnerAction)

		const unlockAction = roomSettingsActions.changeOnlyOwnerCanDoStuff(false)
		serverStore.dispatch(createRoomAction(unlockAction, roomToLeave))
		io.to(roomToLeave).emit(WebSocketEvent.broadcast, unlockAction)
	}
}

function syncState(newSocket: Socket, roomState: IClientRoomState, serverState: IServerState, activeRoom: string) {
	newSocket.emit(WebSocketEvent.broadcast, {
		...setRooms(selectAllRooms(serverState)),
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
		[connectionsActions.replaceAll, selectAllConnections],
		[roomSettingsActions.replaceAll, selectRoomSettings],
		[shamuGraphActions.replace, selectShamuGraphState],
		[globalClockActions.replace, selectGlobalClockState],
		// Sync positions after shamuGraph
		[replacePositions, selectAllPositions],
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

function getRoomOwnerId(serverStore: Store<IServerState>, room: string) {
	const roomState = selectRoomStateByName(serverStore.getState(), room)

	if (!roomState) return `couldn't find room state`

	// Only do it if the current client is the current room owner
	return selectRoomSettings(roomState).ownerId
}
