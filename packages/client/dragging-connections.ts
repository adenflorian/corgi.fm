import {List} from 'immutable'
import {Dispatch} from 'redux'
import {logger} from '@corgifm/common/logger'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, Connection,
	connectionsActions, GhostConnectorAddingOrMoving, IPosition, selectAllPositions,
	selectConnectionsWithSourceIds, selectConnectionsWithTargetIds, selectGhostConnection, selectPosition, doesConnectionBetweenNodesExist, selectConnection,
} from '@corgifm/common/redux'
import {connectorWidth} from './Connections/ConnectionView'

import Victor = require('victor')

interface ConnectionCandidate extends IPosition {
	portNumber: number
}

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: Id,
) {
	const ghostConnection = selectGhostConnection(roomState, ghostConnectionId)

	const movingConnectionId = ghostConnection.movingConnectionId

	const parentNodePosition = selectPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)

	const positionFunction = getPositionFunc()

	// Find nodes within threshold
	const newConnectionCandidates = selectAllPositions(roomState)
		.reduce(expandToPorts, List<ConnectionCandidate>())
		.map(positionFunction)
		.map(getDistanceFromGhostConnector)
		.filter(withinThreshold)

	if (newConnectionCandidates === null) return

	if (newConnectionCandidates.count() === 0) {
		return
	} else if (newConnectionCandidates.count() === 1) {
		const onlyCandidate = newConnectionCandidates.first(false)
		if (onlyCandidate === false) return
		return getChangeConnectionFunc()(onlyCandidate, ghostConnection.port)
	} else {
		const closest = newConnectionCandidates.reduce(getClosest)
		return getChangeConnectionFunc()(closest, ghostConnection.port)
	}

	function validatePosition(position: IPosition) {
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
		const {targetId, targetPort} = selectConnection(roomState, movingConnectionId)
		const sourceId = position.id
		const sourceType = position.targetType
		const sourcePort = position.portNumber
		if (
			doesConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
		) return
		dispatch(connectionsActions.update(movingConnectionId, {
			sourceId,
			sourceType,
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
		const {sourceId, sourcePort} = selectConnection(roomState, movingConnectionId)
		const targetId = position.id
		const targetType = position.targetType
		const targetPort = position.portNumber
		if (
			doesConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
		) return
		dispatch(connectionsActions.update(movingConnectionId, {
			targetId,
			targetType,
			targetPort,
		}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function newConnectionToSource(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExist(
				roomState, position.id, position.portNumber, parentNodePosition.id, port)
		) return

		dispatch(connectionsActions.add(new Connection(
			position.id,
			position.targetType,
			parentNodePosition.id,
			parentNodePosition.targetType,
			position.portNumber,
			port,
		)))
	}

	function newConnectionToTarget(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return

		if (
			doesConnectionBetweenNodesExist(
				roomState, parentNodePosition.id, port, position.id, position.portNumber)
		) return

		dispatch(connectionsActions.add(new Connection(
			parentNodePosition.id,
			parentNodePosition.targetType,
			position.id,
			position.targetType,
			port,
			position.portNumber,
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

	function expandToPorts(all: List<ConnectionCandidate>, current: IPosition): List<ConnectionCandidate> {
		const portCount = ghostConnection.activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? current.outputPortCount
			: current.inputPortCount

		return all.withMutations(mutableAll => {
			for (let i = 0; i < portCount; i++) {
				mutableAll.push({
					...current,
					portNumber: i,
				})
			}
		})
	}

	function getPositionFunc() {
		switch (ghostConnection.activeSourceOrTarget) {
			case ActiveGhostConnectorSourceOrTarget.Source: return moveToOutputPosition(roomState)
			case ActiveGhostConnectorSourceOrTarget.Target: return moveToInputPosition(roomState)
			default: throw new Error(`Unexpected ghost connector status (getPositionFunc): ${ghostConnection.activeSourceOrTarget}`)
		}
	}

	function getDistanceFromGhostConnector(position: ConnectionCandidate) {
		return {
			...position,
			distanceFromGhostConnector: getDistanceBetweenPoints(position, ghostConnection.activeConnector),
		}
	}
}

function getDistanceBetweenPoints(a: Point, b: Point): number {
	return new Victor(a.x, a.y).distance(new Victor(b.x, b.y))
}

const moveToOutputPosition = (roomState: IClientRoomState) => (position: ConnectionCandidate): ConnectionCandidate => {
	const connections = selectConnectionsWithSourceIds(roomState, [position.id])
	const stackCountOnPort = connections.filter(x => x.sourcePort === position.portNumber).count()
	return {
		...position,
		x: position.x + position.width + (connectorWidth * (stackCountOnPort + 1)),
		y: position.y + ((position.height / (1 + position.outputPortCount)) * (position.portNumber + 1)),
	}
}

const moveToInputPosition = (roomState: IClientRoomState) => (position: ConnectionCandidate): ConnectionCandidate => {
	const connections = selectConnectionsWithTargetIds(roomState, [position.id])
	const stackCountOnPort = connections.filter(x => x.targetPort === position.portNumber).count()
	return {
		...position,
		x: position.x - (connectorWidth * (stackCountOnPort + 1)),
		y: position.y + ((position.height / (1 + position.outputPortCount)) * (position.portNumber + 1)),
	}
}

const connectionThreshold = 100

function withinThreshold(distance: ConnectionCandidate & {distanceFromGhostConnector: number}) {
	return distance.distanceFromGhostConnector <= connectionThreshold
}

function getClosest(closest: ConnectionCandidate & {distanceFromGhostConnector: number}, position: ConnectionCandidate & {distanceFromGhostConnector: number}) {
	return position.distanceFromGhostConnector < closest.distanceFromGhostConnector
		? position
		: closest
}
