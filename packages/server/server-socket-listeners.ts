import * as animal from 'animal-id'
import {stripIndents, oneLine} from 'common-tags'
import {Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {
	lobby, maxRoomNameLength, serverClientId,
} from '@corgifm/common/common-constants'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {logger} from '@corgifm/common/logger'
import {
	addClient, roomMemberActions, BroadcastAction,
	CHANGE_ROOM, clientDisconnected, ClientState,
	connectionsActions, createRoom, createRoomAction,
	deletePositions, deleteThingsAny,
	getActionsBlacklist, GLOBAL_SERVER_ACTION, globalClockActions,
	IClientRoomState,
	IServerState, LOAD_ROOM, maxUsernameLength, pointersActions, commonActions,
	replacePositions, roomOwnerRoomActions,
	RoomSettingsAction, roomSettingsActions, RoomsReduxAction, SavedRoom,
	selectAllClients, selectAllConnections,
	selectAllMessages, selectAllPointers, selectAllPositions,
	selectAllRoomMemberIds,
	selectAllRooms, selectAllRoomStates, selectClientById,
	selectClientBySocketId,
	selectConnectionsWithSourceOrTargetIds, selectConnectionsWithTargetIds,
	selectGlobalClockState,
	selectPositionsWithIds, selectRoomExists,
	selectRoomSettings, selectRoomStateByName, selectShamuGraphState,
	SERVER_ACTION, setActiveRoom,
	setChat, setClients, setRooms, shamuGraphActions,
	userLeftRoom, whitelistedRoomActionTypes, isRoomOwnerRoomAction,
	selectPositionsByOwner, roomInfoAction, RoomType, selectRoomInfoState,
	expNodesActions, selectExpNodesState, expPositionActions,
	expConnectionsActions,
	selectExpConnectionsWithTargetIds, selectExpConnectionsWithSourceOrTargetIds,
	selectExpPositionsWithIds, makeRoomMember, selectRoomMemberState,
	selectExpGraphsState, expGraphsActions,
} from '@corgifm/common/redux'
import {WebSocketEvent, NodeToNodeAction} from '@corgifm/common/server-constants'
import {assertUnreachable} from '@corgifm/common/common-utils'
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
			socket.on(WebSocketEvent.broadcast, handleSocketHandlerError(handleBroadcast))

			// TODO Merge with broadcast event above
			socket.on(WebSocketEvent.serverAction, handleSocketHandlerError(handleServerAction))

			socket.on(WebSocketEvent.nodeToNode, handleSocketHandlerError((action: NodeToNodeAction) => {
				const currentRoom = getRoom(socket)
				socket.broadcast.to(currentRoom).emit(WebSocketEvent.nodeToNode, action)
			}))

			socket.on('disconnect', handleSocketHandlerError(handleDisconnect))
		}

		function handleSocketHandlerError(func: (arg: any) => any) {
			return (arg: any) => {
				try {
					return func(arg)
				} catch (error) {
					logger.error(oneLine`error in server socket handler: `, {error, arg})
				}
			}
		}

		function handleBroadcast(action: BroadcastAction) {
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

			if (action[GLOBAL_SERVER_ACTION]) {
				serverStore.dispatch(action)
			} else if (action[SERVER_ACTION]) {
				if (roomOwnerRoomActions.includes(action.type)) {
					const roomOwnerId = getRoomOwnerId(serverStore, currentRoom)

					// Only do it if the current client is the current room owner
					if (clientId !== roomOwnerId) {
						const client = selectClientById(serverStore.getState(), clientId)
						logger.warn(stripIndents`user attempted to run a restricted room action while not room owner.
								clientId: ${clientId} username: ${client.name} room: ${currentRoom} action: ${JSON.stringify(action, null, 2)}`)
						return
					}
				}

				serverStore.dispatch(createRoomAction(action, currentRoom))
			}

			socket.broadcast.to(currentRoom).emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
		}

		function handleServerAction(action: RoomSettingsAction | RoomsReduxAction) {
			logger.trace(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)

			const currentRoom = getRoom(socket)

			const isRestrictedRoomAction = isRoomOwnerRoomAction(action.type)

			if (isRestrictedRoomAction) {
				const client = selectClientById(serverStore.getState(), clientId)
				logger.warn(stripIndents`user attempted to run a restricted room action as a server only action.
						clientId: ${clientId} username: ${client.name} room: ${currentRoom} action: ${JSON.stringify(action, null, 2)}`)
				return
			}

			if (action.type === CHANGE_ROOM) {
				changeRooms(action.room)
			} else if (action.type === 'REQUEST_CREATE_ROOM') {
				makeAndJoinNewRoom(action.name || animal.getId(), action.roomType)
			} else if (action.type === LOAD_ROOM) {
				makeAndJoinNewRoom(animal.getId(), RoomType.Normal, action.savedRoom)
			} else if ((action as any)[GLOBAL_SERVER_ACTION]) {
				serverStore.dispatch(action)
			} else if ((action as any)[SERVER_ACTION]) {
				serverStore.dispatch(createRoomAction(action, currentRoom))
			}
		}

		function handleDisconnect() {
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
		}

		function joinOrCreateRoom(newRoom: string) {
			socket.join(newRoom, err => {
				if (err) throw new Error(err)

				const roomExists = selectRoomExists(serverStore.getState(), newRoom)

				// Do this check after joining the socket to the room, that way the room can't get deleted anymore
				if (roomExists === false) {
					makeNewRoom(newRoom, RoomType.Normal)
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
					makeNewRoom(newRoom, RoomType.Normal)
				}

				onJoinRoom(io, socket, newRoom, serverStore, selectClientBySocketId(serverStore.getState(), socket.id).id)
			})
		}

		function makeAndJoinNewRoom(newRoomName: string, type: RoomType, roomDataToLoad?: SavedRoom) {
			if (selectRoomExists(serverStore.getState(), newRoomName) === false) {
				makeNewRoom(newRoomName, type, roomDataToLoad)
			}

			changeRooms(newRoomName)
		}

		function makeNewRoom(newRoomName: string, type: RoomType, roomDataToLoad?: SavedRoom) {
			if (selectRoomExists(serverStore.getState(), newRoomName)) {
				throw new Error(`room exists, this shouldn't happen`)
			} else {
				serverStore.dispatch(createRoom(newRoomName, Date.now()))
				serverStore.dispatch(createRoomAction(roomSettingsActions.setOwner(clientId), newRoomName))
				serverStore.dispatch(createRoomAction(roomInfoAction.setType(type), newRoomName))

				if (roomDataToLoad) {
					loadServerStuff(newRoomName, serverStore, roomDataToLoad, clientId)
				} else {
					createServerStuff(newRoomName, serverStore, type)
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

	const addRoomMemberAction = roomMemberActions.add(makeRoomMember({id: clientId}))
	serverStore.dispatch(createRoomAction(addRoomMemberAction, room))
	io.to(getRoom(socket)).emit(WebSocketEvent.broadcast, addRoomMemberAction)
}

/** When a user leaves a room, tell all the other room members to delete that user's things */
function onLeaveRoom(io: Server, socket: Socket, roomToLeave: string, serverStore: Store<IServerState>): void {
	const roomState = selectRoomStateByName(serverStore.getState(), roomToLeave)

	if (!roomState) return logger.warn(`onLeaveRoom-couldn't find room state: roomToLeave: ${roomToLeave}`)

	serverStore.dispatch(userLeftRoom(roomToLeave, Date.now()))

	const clientId = selectClientBySocketId(serverStore.getState(), socket.id).id
	const roomType = selectRoomInfoState(roomState).roomType

	switch (roomType) {
		case RoomType.Normal: onLeaveRoomNormal(io, clientId, roomToLeave, serverStore, roomState)
			break
		case RoomType.Experimental: onLeaveRoomExperimental(io, clientId, roomToLeave, serverStore, roomState)
			break
		default: assertUnreachable(roomType)
	}

	onLeaveRoomGeneric(io, clientId, roomToLeave, serverStore, roomState)
}

/** When a user leaves a room, tell all the other room members to delete that user's things */
function onLeaveRoomNormal(io: Server, clientId: Id, roomToLeave: string, serverStore: Store<IServerState>, roomState: IClientRoomState) {
	const nodesOwnedByClient = selectPositionsByOwner(roomState, clientId)

	// filter out nodes that we don't want to delete

	const keyboardIds = nodesOwnedByClient
		.filter(x => x.targetType === ConnectionNodeType.virtualKeyboard)
		.keySeq()

	const otherNodes = nodesOwnedByClient
		.filter(x => x.targetType !== ConnectionNodeType.virtualKeyboard)
		.filter(x => {
			const incomingConnections = selectConnectionsWithTargetIds(roomState, x.id)

			// return true if it has no incoming connections
			if (incomingConnections.count() === 0) return true

			// return true if all incoming connections are from owner's keyboards
			if (incomingConnections.every(y => keyboardIds.includes(y.sourceId))) return true

			return false
		})

	const nodeIdsToDelete = otherNodes.keySeq().concat(keyboardIds).toArray()

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
}

/** When a user leaves a room, tell all the other room members to delete that user's things */
function onLeaveRoomExperimental(io: Server, clientId: Id, roomToLeave: string, serverStore: Store<IServerState>, roomState: IClientRoomState) {
	const nodesOwnedByClient = selectExpNodesState(roomState).filter(x => x.ownerId === clientId)

	// filter out nodes that we don't want to delete

	const keyboardIds = nodesOwnedByClient
		.filter(x => x.type === 'keyboard')
		.keySeq()

	const otherNodes = nodesOwnedByClient
		.filter(x => x.type !== 'keyboard')
		.filter(x => {
			const incomingConnections = selectExpConnectionsWithTargetIds(roomState, x.id)

			// return true if it has no incoming connections
			if (incomingConnections.count() === 0) return true

			// return true if all incoming connections are from owner's keyboards
			if (incomingConnections.every(y => keyboardIds.includes(y.sourceId))) return true

			return false
		})

	const nodeIdsToDelete = otherNodes.keySeq().concat(keyboardIds).toArray()

	const connectionIdsToDelete = selectExpConnectionsWithSourceOrTargetIds(roomState, nodeIdsToDelete)
		.map(x => x.id)
		.toList()
	const deleteConnectionsAction = expConnectionsActions.delete(connectionIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteConnectionsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteConnectionsAction)

	const positionIdsToDelete = selectExpPositionsWithIds(roomState, nodeIdsToDelete).map(x => x.id)
	const deletePositionsAction = expPositionActions.delete(positionIdsToDelete)
	serverStore.dispatch(createRoomAction(deletePositionsAction, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePositionsAction)

	const deleteNodes = expNodesActions.deleteMany(nodeIdsToDelete)
	serverStore.dispatch(createRoomAction(deleteNodes, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deleteNodes)
}

/** When a user leaves a room, tell all the other room members to delete that user's things */
function onLeaveRoomGeneric(io: Server, clientId: Id, roomToLeave: string, serverStore: Store<IServerState>, roomState: IClientRoomState) {
	const deletePointer = pointersActions.delete(clientId)
	serverStore.dispatch(createRoomAction(deletePointer, roomToLeave))
	io.to(roomToLeave).emit(WebSocketEvent.broadcast, deletePointer)

	const deleteRoomMemberAction = roomMemberActions.delete(clientId)
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
		...commonActions.notReady(),
		alreadyBroadcasted: true,
		source: server,
	})
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
		[roomInfoAction.replace, selectRoomInfoState],
		[pointersActions.replaceAll, selectAllPointers],
		[roomMemberActions.replaceAll, selectRoomMemberState],
		[setChat, selectAllMessages],
		[connectionsActions.replaceAll, selectAllConnections],
		[roomSettingsActions.replaceAll, selectRoomSettings],
		[shamuGraphActions.replace, selectShamuGraphState],
		[globalClockActions.replace, selectGlobalClockState],
		// Sync positions after shamuGraph
		[replacePositions, selectAllPositions],
		// exp
		[expGraphsActions.replaceAll, selectExpGraphsState],
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
		...commonActions.ready(),
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
