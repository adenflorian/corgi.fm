import {Middleware} from 'redux'
import Victor = require('victor')
import {Point} from '../common-types'
import {logger} from '../logger'
import {connectionsActions, GhostConnectorStatus, IConnectionAction, selectConnection, STOP_DRAGGING_GHOST_CONNECTOR} from './connections-redux'
import {IClientAppState} from './index'
import {IPosition, selectAllPositions} from './positions-redux'

const connectionThreshold = 100

export const connectionsMiddleware: Middleware<{}, IClientAppState> =
	({dispatch, getState}) => next => (action: IConnectionAction) => {
		const stateBefore = getState()

		next(action)

		const stateAfter = getState()

		switch (action.type) {
			case STOP_DRAGGING_GHOST_CONNECTOR: {
				try {
					handleStopDraggingGhostConnector(action.id)
				} catch (error) {
					logger.warn('Caught error (will ignore) when handling ' + STOP_DRAGGING_GHOST_CONNECTOR + ': ', error)
					return
				}
			}
		}

		function handleStopDraggingGhostConnector(connectionId: string) {

			const connection = selectConnection(stateBefore.room, connectionId)

			const ghostConnector = connection.ghostConnector

			const validatePosition = (position: IPosition) => {
				if (
					position.id === connection.sourceId ||
					position.id === connection.targetId
				) {
					return false
				} else {
					return true
				}
			}

			const changeConnectionSource = (position: IPosition) => {
				if (validatePosition(position) === false) return
				dispatch(connectionsActions.update(connectionId, {
					sourceId: position.id,
					sourceType: position.targetType,
				}))
			}

			const changeConnectionTarget = (position: IPosition) => {
				if (validatePosition(position) === false) return
				dispatch(connectionsActions.update(connectionId, {
					targetId: position.id,
					targetType: position.targetType,
				}))
			}

			const getChangeConnectionFunc = () => {
				switch (ghostConnector.status) {
					case GhostConnectorStatus.activeSource: return changeConnectionSource
					case GhostConnectorStatus.activeTarget: return changeConnectionTarget
					default: throw new Error('Unexpected ghost connector status (changeConnection): ' + ghostConnector.status)
				}
			}

			const getPositionFunc = () => {
				switch (ghostConnector.status) {
					case GhostConnectorStatus.activeSource: return moveToOutputPosition
					case GhostConnectorStatus.activeTarget: return moveToInputPosition
					default: throw new Error('Unexpected ghost connector status (getPositionFunc): ' + ghostConnector.status)
				}
			}

			// Find nodes within threshold
			const newConnectionCandidates = selectAllPositions(stateAfter.room)
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

			function getDistanceFromGhostConnector(position: IPosition) {
				return {
					...position,
					distanceFromGhostConnector: getDistanceBetweenPoints(position, ghostConnector),
				}
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

function withinThreshold(distance: IPosition & {distanceFromGhostConnector: number}) {
	return distance.distanceFromGhostConnector <= connectionThreshold
}

function getClosest(closest: IPosition & {distanceFromGhostConnector: number}, position: IPosition & {distanceFromGhostConnector: number}) {
	return position.distanceFromGhostConnector < closest.distanceFromGhostConnector
		? position
		: closest
}
