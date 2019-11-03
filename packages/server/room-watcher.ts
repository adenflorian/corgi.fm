import {Store} from 'redux'
import {Server} from 'socket.io'
import {lobby, expLobby} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'
import {deleteRoom, Room, selectAllRooms, setRooms} from '@corgifm/common/redux'
import {WebSocketEvent} from '@corgifm/common/server-constants'

export function startRoomWatcher(io: Server, serverStore: Store) {
	setInterval(checkRooms, 5000)

	function checkRooms() {
		const notLobby = (room: Room) => room.name !== lobby && room.name !== expLobby
		const isEmpty = (room: Room) => ioRoomNames.includes(room.name) === false
		const emptyForTooLong = (room: Room) => (Date.now() - room.lastTimeUserLeftTimestamp!) > 60 * 1000
		const destroy = (room: Room) => serverStore.dispatch(deleteRoom(room.name))

		const ioRoomNames = Object.keys(io.sockets.adapter.rooms)

		const emptyRooms = selectAllRooms(serverStore.getState())
			.filter(notLobby)
			.filter(isEmpty)
			.filter(emptyForTooLong)

		emptyRooms.forEach(destroy)

		if (emptyRooms.count() > 0) {
			logger.log('deleting empty rooms: ', emptyRooms.toJS())

			io.local.emit(WebSocketEvent.broadcast, {
				...setRooms(selectAllRooms(serverStore.getState())),
				alreadyBroadcasted: true,
				source: 'server',
			})
		}
	}
}
