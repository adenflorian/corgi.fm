import {Dispatch} from 'redux'
import {logger} from '@corgifm/common/logger'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, Connection,
	connectionsActions, GhostConnectorAddingOrMoving, IPosition,
	selectGhostConnection, selectPosition, doesConnectionBetweenNodesExist,
	selectConnection,
	selectRoomInfoState, RoomType, DeleteGhostInfo, selectExpPosition,
	expConnectionsActions, ExpConnection, ExpPosition,
	doesExpConnectionBetweenNodesExist,
	selectExpConnection,
} from '@corgifm/common/redux'

type ConnectionCandidate = IPosition | ExpPosition

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: Id,
	info: DeleteGhostInfo,
) {
	const roomType = selectRoomInfoState(roomState).roomType

	const ghostConnection = selectGhostConnection(roomState, ghostConnectionId)

	const getConnection = roomType === RoomType.Experimental
		? selectExpConnection : selectConnection

	const movingConnectionId = ghostConnection.movingConnectionId

	const parentNodePosition = roomType === RoomType.Experimental
		? selectExpPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)
		: selectPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)

	const winningPosition = roomType === RoomType.Experimental
		? selectExpPosition(roomState, info.nodeId)
		: selectPosition(roomState, info.nodeId)

	const targetPort = info.portId

	return getChangeConnectionFunc()(winningPosition, ghostConnection.port)

	function doesConnectionBetweenNodesExistLocal(sourceId: Id, sourcePort: number, targetId: Id) {
		return roomType === RoomType.Experimental
			? doesExpConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
			: doesConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
	}

	function validatePosition(position: ConnectionCandidate) {
		if (position.id === parentNodePosition.id) {
			return false
		} else {
			return true
		}
	}

	function changeConnectionSource(position: ConnectionCandidate) {
		if (validatePosition(position) === false) return
		if (movingConnectionId === undefined) {
			return logger.error('[changeConnectionSource] movingConnectionId is undefined but should never be right here')
		}
		const {targetId, targetPort} = getConnection(roomState, movingConnectionId)
		const sourceId = position.id
		const sourceType = position.targetType
		const sourcePort = targetPort
		if (
			doesConnectionBetweenNodesExistLocal(
				sourceId, sourcePort, targetId)
		) return

		roomType === RoomType.Experimental
			? dispatch(expConnectionsActions.updateSource(movingConnectionId, {
				sourceId,
				sourceType: sourceType as ExpConnection['sourceType'],
				sourcePort,
			}))
			: dispatch(connectionsActions.updateSource(movingConnectionId, {
				sourceId,
				sourceType: sourceType as IPosition['targetType'],
				sourcePort,
			}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function changeConnectionTarget(position: ConnectionCandidate) {
		if (validatePosition(position) === false) return
		if (movingConnectionId === undefined) {
			return logger.error('[changeConnectionTarget] movingConnectionId is undefined but should never be right here')
		}
		const {sourceId, sourcePort} = getConnection(roomState, movingConnectionId)
		const targetId = position.id
		const targetType = position.targetType
		if (
			doesConnectionBetweenNodesExistLocal(
				sourceId, sourcePort, targetId)
		) return

		roomType === RoomType.Experimental
			? dispatch(expConnectionsActions.updateTarget(movingConnectionId, {
				targetId,
				targetType: targetType as ExpConnection['targetType'],
				targetPort,
			}))
			: dispatch(connectionsActions.updateTarget(movingConnectionId, {
				targetId,
				targetType: targetType as IPosition['targetType'],
				targetPort,
			}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function newConnectionToSource(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				position.id, targetPort, parentNodePosition.id)
		) return

		roomType === RoomType.Experimental
			? dispatch(expConnectionsActions.add(new ExpConnection(
				position.id,
				position.targetType as ExpConnection['targetType'],
				parentNodePosition.id,
				parentNodePosition.targetType as ExpConnection['targetType'],
				targetPort,
				port,
			)))
			: dispatch(connectionsActions.add(new Connection(
				position.id,
				position.targetType as IPosition['targetType'],
				parentNodePosition.id,
				parentNodePosition.targetType as IPosition['targetType'],
				targetPort,
				port,
			)))
	}

	function newConnectionToTarget(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				parentNodePosition.id, port, position.id)
		) return

		roomType === RoomType.Experimental
			? dispatch(expConnectionsActions.add(new ExpConnection(
				parentNodePosition.id,
				parentNodePosition.targetType as ExpConnection['targetType'],
				position.id,
				position.targetType as ExpConnection['targetType'],
				port,
				targetPort,
			)))
			: dispatch(connectionsActions.add(new Connection(
				parentNodePosition.id,
				parentNodePosition.targetType as IPosition['targetType'],
				position.id,
				position.targetType as IPosition['targetType'],
				port,
				targetPort,
			)))
	}

	function getChangeConnectionFunc() {
		if (ghostConnection.addingOrMoving === GhostConnectorAddingOrMoving.Moving) {
			switch (ghostConnection.activeSourceOrTarget) {
				case ActiveGhostConnectorSourceOrTarget.Source: return changeConnectionSource
				case ActiveGhostConnectorSourceOrTarget.Target: return changeConnectionTarget
				default: throw new Error(`Unexpected ghost connector status (moving)(changeConnection): ${ghostConnection.activeSourceOrTarget}`)
			}
		} else if (ghostConnection.addingOrMoving === GhostConnectorAddingOrMoving.Adding) {
			switch (ghostConnection.activeSourceOrTarget) {
				case ActiveGhostConnectorSourceOrTarget.Source: return newConnectionToSource
				case ActiveGhostConnectorSourceOrTarget.Target: return newConnectionToTarget
				default: throw new Error(`Unexpected ghost connector status (adding)(changeConnection): ${ghostConnection.activeSourceOrTarget}`)
			}
		} else {
			throw new Error(`Unexpected ghost connector addingOrMoving (changeConnection): ${ghostConnection.addingOrMoving}`)
		}
	}
}
