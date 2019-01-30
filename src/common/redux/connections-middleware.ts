import {Middleware} from 'redux'
import Victor = require('victor')
import {Point} from '../common-types'
import {connectionsActions, IConnectionAction, selectConnection, STOP_DRAGGING_GHOST_CONNECTOR} from './connections-redux'
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

				const changeConnectionSource = (position: IPosition) => {
					dispatch(connectionsActions.update(action.id, {
						sourceId: position.id,
						sourceType: position.targetType,
					}))
				}

				const ghostConnector = selectConnection(stateBefore.room, action.id).ghostConnector

				// Find nodes within threshold
				const newConnectionCandidates = selectAllPositions(stateAfter.room)
					.map(moveToOutputPosition)
					.map(getDistanceFromGhostConnector)
					.filter(withinThreshold)

				if (newConnectionCandidates.count() === 0) {
					return
				} else if (newConnectionCandidates.count() === 1) {
					const onlyCandidate = newConnectionCandidates.first(false)
					if (onlyCandidate === false) return
					return changeConnectionSource(onlyCandidate)
				} else {
					const closest = newConnectionCandidates.reduce(getClosest)
					return changeConnectionSource(closest)
				}

				function getDistanceFromGhostConnector(position: IPosition) {
					return {
						...position,
						distanceFromGhostConnector: getDistanceBetweenPoints(position, ghostConnector),
					}
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

function withinThreshold(distance: IPosition & {distanceFromGhostConnector: number}) {
	return distance.distanceFromGhostConnector <= connectionThreshold
}

function getClosest(closest: IPosition & {distanceFromGhostConnector: number}, position: IPosition & {distanceFromGhostConnector: number}) {
	return position.distanceFromGhostConnector < closest.distanceFromGhostConnector
		? position
		: closest
}
