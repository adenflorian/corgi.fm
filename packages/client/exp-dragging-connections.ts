import {Dispatch} from 'redux'
import {logger} from '@corgifm/common/logger'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget,
	GhostConnectorAddingOrMoving,
	selectExpGhostConnection,
	ExpDeleteGhostInfo, selectExpPosition,
	expConnectionsActions, ExpConnection, ExpPosition,
	doesExpConnectionBetweenNodesExist,
	selectExpConnection, chatSystemMessage, selectExpNode,
} from '@corgifm/common/redux'
import {NodeManager} from './Experimental/NodeManager'

type ConnectionCandidate = ExpPosition

export function handleStopDraggingExpGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: Id,
	info: ExpDeleteGhostInfo, nodeManager: NodeManager,
) {
	const ghostConnection = selectExpGhostConnection(roomState, ghostConnectionId)

	const getConnection = selectExpConnection

	const movingConnectionId = ghostConnection.movingConnectionId

	const parentNodePosition = selectExpPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)
	const parentNode = selectExpNode(roomState, parentNodePosition.id)

	const winningPosition = selectExpPosition(roomState, info.nodeId)

	const mouseUpPort = info.portId

	const [portToConnectToType] = nodeManager.getPortType(info.nodeId, mouseUpPort)

	if (ghostConnection.type !== portToConnectToType) {
		dispatch(chatSystemMessage(`Connections between ${ghostConnection.type} ports and ${portToConnectToType} ports are not allowed.`))
		return
	}

	return getChangeConnectionFunc()(winningPosition, ghostConnection.port)

	function doesConnectionBetweenNodesExistLocal(sourceId: Id, sourcePort: Id, targetId: Id, targetPort: Id) {
		return doesExpConnectionBetweenNodesExist(
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

		dispatch(expConnectionsActions.updateSource(movingConnectionId, {
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

		dispatch(expConnectionsActions.updateTarget(movingConnectionId, {
			targetId,
			targetType,
			targetPort,
		}))
	}

	function newConnectionToSource(position: ConnectionCandidate, port: Id) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				position.id, mouseUpPort, parentNodePosition.id, port)
		) return

		dispatch(expConnectionsActions.add(new ExpConnection(
			position.id,
			position.targetType,
			parentNodePosition.id,
			parentNodePosition.targetType,
			mouseUpPort,
			port,
			ghostConnection.type,
			parentNode.groupId,
		)))
	}

	function newConnectionToTarget(position: ConnectionCandidate, port: Id) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExistLocal(
				parentNodePosition.id, port, position.id, mouseUpPort)
		) return

		dispatch(expConnectionsActions.add(new ExpConnection(
			parentNodePosition.id,
			parentNodePosition.targetType,
			position.id,
			position.targetType,
			port,
			mouseUpPort,
			ghostConnection.type,
			parentNode.groupId,
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
