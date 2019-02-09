import {Middleware} from 'redux'
import Victor = require('victor')
import {Point} from '../common-types'
import {logger} from '../logger'
import {OrganizeGraphAction} from './common-actions'
import {BroadcastAction} from './common-redux-types'
import {
	calculateExtremes, Connection, connectionsActions,
	GhostConnectorStatus, GhostConnectorType, IClientAppState,
	IConnection, IConnectionAction, IConnections,
	IPosition, IPositions, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID, ORGANIZE_GRAPH, selectAllConnections, selectAllPositions, selectConnection, selectConnectionsWithTargetIds2, STOP_DRAGGING_GHOST_CONNECTOR, updatePositions,
} from './index'

const connectionThreshold = 100

export const connectionsMiddleware: Middleware<{}, IClientAppState> =
	({dispatch, getState}) => next => (action: IConnectionAction | OrganizeGraphAction) => {
		const stateBefore = getState()

		next(action)

		const stateAfter = getState()

		switch (action.type) {
			case STOP_DRAGGING_GHOST_CONNECTOR: {
				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return
				try {
					handleStopDraggingGhostConnector(action.id)
				} catch (error) {
					logger.warn('Caught error (will ignore) when handling ' + STOP_DRAGGING_GHOST_CONNECTOR + ': ', error)
					return
				}
				return
			}
			// case ORGANIZE_GRAPH: {
			// 	dispatch(
			// 		updatePositions(
			// 			calculatePositionsGivenConnections(
			// 				selectAllPositions(stateAfter.room),
			// 				selectAllConnections(stateAfter.room),
			// 			),
			// 		),
			// 	)
			// 	return
			// }
			default: return
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

			const newConnectionToSource = (position: IPosition) => {
				if (validatePosition(position) === false) return
				dispatch(connectionsActions.add(new Connection(
					position.id,
					position.targetType,
					connection.targetId,
					connection.targetType,
				)))
			}

			const newConnectionToTarget = (position: IPosition) => {
				if (validatePosition(position) === false) return
				dispatch(connectionsActions.add(new Connection(
					connection.sourceId,
					connection.sourceType,
					position.id,
					position.targetType,
				)))
			}

			const getChangeConnectionFunc = () => {
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

// TODO Take position width and height into account
export function calculatePositionsGivenConnections(positions: IPositions, connections: IConnections) {
	const originalPositions = positions

	const connectionsToMasterAudioOutput = selectConnectionsWithTargetIds2(connections, [MASTER_AUDIO_OUTPUT_TARGET_ID]).toList()

	const newPositions = originalPositions.withMutations(mutablePositions => {
		const xSpacing = 700
		const ySpacing = 256

		mutablePositions.update(MASTER_AUDIO_OUTPUT_TARGET_ID, x => ({...x, x: 0, y: 0}))

		const calculatePosition = (x: number, prevY: number) => (connection: IConnection, i: number) => {
			mutablePositions.update(connection.sourceId, z => ({...z, x: -xSpacing * x, y: (i * ySpacing) + (prevY * ySpacing)}))
			selectConnectionsWithTargetIds2(connections, [connection.sourceId])
				.toList()
				.forEach(calculatePosition(x + 1, i))
		}
		connectionsToMasterAudioOutput.forEach(calculatePosition(1, 0))
	})

	// Centering graph
	const {leftMost, rightMost, topMost, bottomMost} = calculateExtremes(newPositions)
	const adjustX = -(leftMost + rightMost) / 2
	const adjustY = -(topMost + bottomMost) / 2

	// Center audio output (root node) vertically
	return newPositions
		.map(x => ({...x, x: x.x + adjustX, y: x.y + adjustY}))
		.update(MASTER_AUDIO_OUTPUT_TARGET_ID, x => ({...x, y: 0}))
		.update(MASTER_CLOCK_SOURCE_ID, x => ({...x, y: 0}))
}
