import {Store} from 'redux'
import {Server} from 'socket.io'
import {logger} from '../common/logger'
import {deleteRoom, selectAllRoomNames, setRooms} from '../common/redux'
import {WebSocketEvent} from '../common/server-constants'
import {lobby} from './server-socket-listeners'

export function startRoomWatcher(io: Server, serverStore: Store) {
	setInterval(checkRooms, 5000)

	function checkRooms() {
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
	}
}
