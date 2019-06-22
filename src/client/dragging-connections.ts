import {List, Map} from 'immutable'
import {Dispatch} from 'redux'
import Victor = require('victor')
import {Point} from '../common/common-types'
import {logger} from '../common/logger'
import {IClientRoomState} from '../common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, Connection,
	connectionsActions, GhostConnectorAddingOrMoving, IPosition, selectAllPositions, selectGhostConnection, selectPosition,
} from '../common/redux/index'

interface ConnectionCandidate extends IPosition {
	portNumber: number
}

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: string,
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
		dispatch(connectionsActions.update(movingConnectionId, {
			sourceId: position.id,
			sourceType: position.targetType,
			sourcePort: position.portNumber,
		}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function changeConnectionTarget(position: ConnectionCandidate) {
		if (validatePosition(position) === false) return
		if (movingConnectionId === undefined) {
			return logger.error('[changeConnectionTarget] movingConnectionId is undefined but should never be right here')
		}
		dispatch(connectionsActions.update(movingConnectionId, {
			targetId: position.id,
			targetType: position.targetType,
		}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function newConnectionToSource(position: ConnectionCandidate, port: number) {
		if (validatePosition(position) === false) return
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
				default: throw new Error('Unexpected ghost connector status (moving)(changeConnection): ' + ghostConnection.activeSourceOrTarget)
			}
		} else if (ghostConnection.addingOrMoving === GhostConnectorAddingOrMoving.Adding) {
			switch (ghostConnection.activeSourceOrTarget) {
				case ActiveGhostConnectorSourceOrTarget.Source: return newConnectionToSource
				case ActiveGhostConnectorSourceOrTarget.Target: return newConnectionToTarget
				default: throw new Error('Unexpected ghost connector status (adding)(changeConnection): ' + ghostConnection.activeSourceOrTarget)
			}
		} else {
			throw new Error('Unexpected ghost connector addingOrMoving (changeConnection): ' + ghostConnection.addingOrMoving)
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
			case ActiveGhostConnectorSourceOrTarget.Source: return moveToOutputPosition
			case ActiveGhostConnectorSourceOrTarget.Target: return moveToInputPosition
			default: throw new Error('Unexpected ghost connector status (getPositionFunc): ' + ghostConnection.activeSourceOrTarget)
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

function moveToOutputPosition(position: ConnectionCandidate): ConnectionCandidate {
	return {
		...position,
		x: position.x + position.width,
		y: position.y + ((position.height / (1 + position.outputPortCount)) * (position.portNumber + 1)),
	}
}

function moveToInputPosition(position: ConnectionCandidate): ConnectionCandidate {
	return {
		...position,
		x: position.x,
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
