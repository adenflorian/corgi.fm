import {Dispatch} from 'redux'
import Victor = require('victor')
import {Point} from '../common/common-types'
import {IClientRoomState} from '../common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, Connection,
	connectionsActions, GhostConnectorAddingOrMoving, IPosition, selectAllPositions, selectGhostConnection, selectPosition,
} from '../common/redux/index'

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: string,
) {
	const ghostConnection = selectGhostConnection(roomState, ghostConnectionId)

	const parentNodePosition = selectPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)

	// Find nodes within threshold
	const newConnectionCandidates = selectAllPositions(roomState)
		.map(getPositionFunc())
		.map(getDistanceFromGhostConnector)
		.filter(withinThreshold)

	if (newConnectionCandidates === null) return

	if (newConnectionCandidates.count() === 0) {
		return
	} else if (newConnectionCandidates.count() === 1) {
		const onlyCandidate = newConnectionCandidates.first(false)
		if (onlyCandidate === false) return
		return getChangeConnectionFunc()(onlyCandidate)
	} else {
		const closest = newConnectionCandidates.reduce(getClosest)
		return getChangeConnectionFunc()(closest)
	}

	function validatePosition(position: IPosition) {
		if (position.id === parentNodePosition.id) {
			return false
		} else {
			return true
		}
	}

	function changeConnectionSource(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.update(ghostConnectionId, {
			sourceId: position.id,
			sourceType: position.targetType,
		}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function changeConnectionTarget(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.update(ghostConnectionId, {
			targetId: position.id,
			targetType: position.targetType,
		}))
		// getAllInstruments().get(connection.targetId)!
		// 	.releaseAllScheduledFromSourceId(connection.sourceId)
	}

	function newConnectionToSource(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.add(new Connection(
			position.id,
			position.targetType,
			parentNodePosition.id,
			parentNodePosition.targetType,
		)))
	}

	function newConnectionToTarget(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.add(new Connection(
			parentNodePosition.id,
			parentNodePosition.targetType,
			position.id,
			position.targetType,
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

	function getPositionFunc() {
		switch (ghostConnection.activeSourceOrTarget) {
			case ActiveGhostConnectorSourceOrTarget.Source: return moveToOutputPosition
			case ActiveGhostConnectorSourceOrTarget.Target: return moveToInputPosition
			default: throw new Error('Unexpected ghost connector status (getPositionFunc): ' + ghostConnection.activeSourceOrTarget)
		}
	}

	function getDistanceFromGhostConnector(position: IPosition) {
		return {
			...position,
			distanceFromGhostConnector: getDistanceBetweenPoints(position, ghostConnection.activeConnector),
		}
	}
}

function getDistanceBetweenPoints(a: Point, b: Point): number {
	return new Victor(a.x, a.y).distance(new Victor(b.x, b.y))
}

function moveToOutputPosition(position: IPosition): IPosition {
	return {
		...position,
		x: position.x + position.width,
		y: position.y + (position.height / 2),
	}
}

function moveToInputPosition(position: IPosition): IPosition {
	return {
		...position,
		x: position.x,
		y: position.y + (position.height / 2),
	}
}

const connectionThreshold = 100

function withinThreshold(distance: IPosition & {distanceFromGhostConnector: number}) {
	return distance.distanceFromGhostConnector <= connectionThreshold
}

function getClosest(closest: IPosition & {distanceFromGhostConnector: number}, position: IPosition & {distanceFromGhostConnector: number}) {
	return position.distanceFromGhostConnector < closest.distanceFromGhostConnector
		? position
		: closest
}
