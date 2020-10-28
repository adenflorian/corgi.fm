import {Dispatch} from 'redux'
import {logger} from '@corgifm/common/logger'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, Connection,
	connectionsActions, GhostConnectorAddingOrMoving, IPosition,
	selectGhostConnection, selectPosition, doesConnectionBetweenNodesExist,
	selectConnection, DeleteGhostInfo,
} from '@corgifm/common/redux'

type ConnectionCandidate = IPosition

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: Id,
	info: DeleteGhostInfo,
) {
	const ghostConnection = selectGhostConnection(roomState, ghostConnectionId)

	const getConnection = selectConnection

	const movingConnectionId = ghostConnection.movingConnectionId

	const parentNodePosition = selectPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)

	const winningPosition = selectPosition(roomState, info.nodeId)

	const mouseUpPort = info.portId

	return getChangeConnectionFunc()(winningPosition, ghostConnection.port)

	function doesConnectionBetweenNodesExistLocal(sourceId: Id, sourcePort: number, targetId: Id, targetPort: number) {
		return doesConnectionBetweenNodesExist(
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
		const sourcePort = mouseUpPort
		if (
			doesConnectionBetweenNodesExistLocal(
				sourceId, sourcePort, targetId, targetPort)
		) return

		dispatch(connectionsActions.updateSource(movingConnectionId, {
			sourceId,
			sourceType,
			sourcePort,
		}))
	}

	function changeConnectionTarget(position: ConnectionCandidate) {
		if (validatePosition(position) === false) return
		if (movingConnectionId === undefined) {
			return logger.error('[changeConnectionTarget] movingConnectionId is undefined but should never be right here')
		}
		const {sourceId, sourcePort} = getConnection(roomState, movingConnectionId)
		const targetId = position.id
		const targetType = position.targetType
		const targetPort = mouseUpPort
		if (
			doesConnectionBetweenNodesExistLocal(
				sourceId, sourcePort, targetId, targetPort)
		) return

		dispatch(connectionsActions.updateTarget(movingConnectionId, {
			targetId,
			targetType,
			targetPort,
		}))
	}

	function newConnectionToSource(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				position.id, mouseUpPort, parentNodePosition.id, port)
		) return

		dispatch(connectionsActions.add(new Connection(
			position.id,
			position.targetType,
			parentNodePosition.id,
			parentNodePosition.targetType,
			mouseUpPort,
			port,
		)))
	}

	function newConnectionToTarget(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				parentNodePosition.id, port, position.id, mouseUpPort)
		) return

		dispatch(connectionsActions.add(new Connection(
			parentNodePosition.id,
			parentNodePosition.targetType,
			position.id,
			position.targetType,
			port,
			mouseUpPort,
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
