import {Dispatch} from 'redux'
import Victor = require('victor')
import {Point} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {
	Connection, connectionsActions, GhostConnectorStatus,
	GhostConnectorType, IPosition, selectAllPositions, selectConnection,
} from './index'

export function handleStopDraggingGhostConnector(
	roomState: IClientRoomState, dispatch: Dispatch, connectionId: string,
) {
	const connection = selectConnection(roomState, connectionId)

	const ghostConnector = connection.ghostConnector

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
		if (
			position.id === connection.sourceId ||
			position.id === connection.targetId
		) {
			return false
		} else {
			return true
		}
	}

	function changeConnectionSource(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.update(connectionId, {
			sourceId: position.id,
			sourceType: position.targetType,
		}))
	}

	function changeConnectionTarget(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.update(connectionId, {
			targetId: position.id,
			targetType: position.targetType,
		}))
	}

	function newConnectionToSource(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.add(new Connection(
			position.id,
			position.targetType,
			connection.targetId,
			connection.targetType,
		)))
	}

	function newConnectionToTarget(position: IPosition) {
		if (validatePosition(position) === false) return
		dispatch(connectionsActions.add(new Connection(
			connection.sourceId,
			connection.sourceType,
			position.id,
			position.targetType,
		)))
	}

	function getChangeConnectionFunc() {
		if (ghostConnector.addingOrMoving === GhostConnectorType.moving) {
			switch (ghostConnector.status) {
				case GhostConnectorStatus.activeSource: return changeConnectionSource
				case GhostConnectorStatus.activeTarget: return changeConnectionTarget
				default: throw new Error('Unexpected ghost connector status (moving)(changeConnection): ' + ghostConnector.status)
			}
		} else if (ghostConnector.addingOrMoving === GhostConnectorType.adding) {
			switch (ghostConnector.status) {
				case GhostConnectorStatus.activeSource: return newConnectionToSource
				case GhostConnectorStatus.activeTarget: return newConnectionToTarget
				default: throw new Error('Unexpected ghost connector status (adding)(changeConnection): ' + ghostConnector.status)
			}
		} else {
			throw new Error('Unexpected ghost connector addingOrMoving (changeConnection): ' + ghostConnector.addingOrMoving)
		}
	}

	function getPositionFunc() {
		switch (ghostConnector.status) {
			case GhostConnectorStatus.activeSource: return moveToOutputPosition
			case GhostConnectorStatus.activeTarget: return moveToInputPosition
			default: throw new Error('Unexpected ghost connector status (getPositionFunc): ' + ghostConnector.status)
		}
	}

	function getDistanceFromGhostConnector(position: IPosition) {
		return {
			...position,
			distanceFromGhostConnector: getDistanceBetweenPoints(position, ghostConnector),
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
