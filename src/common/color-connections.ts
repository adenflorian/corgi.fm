import {Dispatch} from 'redux'
import {logger} from './logger'
import {IClientRoomState, IConnection, selectPosition, updatePosition} from './redux'

export function colorConnections(roomState: IClientRoomState, dispatch: Dispatch, connection: IConnection) {
	try {
		goo()
	} catch (error) {
		logger.warn('Caught error (will ignore) when doing colorConnections: ', error)
		return
	}

	function goo() {

		console.log('colorConnections 1')

		// When a connection changes
		// The middleware will trace the graph downstream from that connection
		// 	and dispatch color updates for all necessary items

		// get target node

		// get color of source node
		const sourceColor = selectPosition(roomState, connection.sourceId).color
		console.log('colorConnections 2 - sourceColor: ', sourceColor)

		// update target node color
		dispatch(updatePosition(connection.targetId, {
			color: sourceColor,
		}))
		console.log('colorConnections 3')
	}
}
