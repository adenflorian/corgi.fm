import {List} from 'immutable'
import {Dispatch} from 'redux'
import {
	IClientRoomState, IConnection, selectConnection,
	selectConnectionsWithSourceIds, selectPosition, updatePosition,
} from './redux'
import {CssColor} from './shamu-color'

export function handleAddConnection(roomState: IClientRoomState, dispatch: Dispatch, originalConnection: IConnection) {
	const sourceColor = selectPosition(roomState, originalConnection.sourceId).color

	updateConnectionTargetColor(roomState, dispatch, originalConnection, sourceColor)
}

export function handleDeleteConnection(beforeState: IClientRoomState, dispatch: Dispatch, connectionIds: List<string>) {
	connectionIds.forEach(connectionId => {
		const connection = selectConnection(beforeState, connectionId)
		updateConnectionTargetColor(beforeState, dispatch, connection, CssColor.subtleGrayBlackBg)
	})
}

function updateConnectionTargetColor(
	roomState: IClientRoomState,
	dispatch: Dispatch,
	connection: IConnection,
	color: string,
	processedConnectionIDs = List<string>(),
) {
	if (processedConnectionIDs.contains(connection.id)) return console.log('loop detected')

	dispatch(updatePosition(connection.targetId, {
		color,
	}))

	const nextConnections = selectConnectionsWithSourceIds(roomState, [connection.targetId])

	nextConnections.forEach(
		x => updateConnectionTargetColor(roomState, dispatch, x, color, processedConnectionIDs.push(connection.id)),
	)
}
