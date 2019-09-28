import {List, Record} from 'immutable'
import {Dispatch} from 'redux'
import {logger} from '@corgifm/common/logger'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	ActiveGhostConnectorSourceOrTarget, ExpConnection,
	expConnectionsActions, GhostConnectorAddingOrMoving, ExpPosition, selectExpAllPositions,
	selectGhostConnection, selectExpPosition, doesExpConnectionBetweenNodesExist,
	selectExpConnection, selectExpConnectionIdsForNodeLeftPort,
	selectExpConnectionIdsForNodeRightPort,
	defaultExpPosition,
} from '@corgifm/common/redux'
import {connectorWidth} from './Connections/ConnectionView'

import Victor = require('victor')

interface ConnectionCandidate extends ReturnType<typeof makeConnectionCandidate> {}

const makeConnectionCandidate = Record({
	...defaultExpPosition,
	portNumber: 0,
})

export function handleStopDraggingGhostConnectorExp(
	roomState: IClientRoomState, dispatch: Dispatch, ghostConnectionId: Id,
) {
	const ghostConnection = selectGhostConnection(roomState, ghostConnectionId)

	const movingConnectionId = ghostConnection.movingConnectionId

	const parentNodePosition = selectExpPosition(roomState, ghostConnection.inactiveConnector.parentNodeId)

	const positionFunction = getPositionFunc()

	// Find nodes within threshold
	const newConnectionCandidates = selectExpAllPositions(roomState)
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
		const {targetId, targetPort} = selectExpConnection(roomState, movingConnectionId)
		const sourceId = position.id
		const sourceType = position.targetType
		const sourcePort = position.portNumber
		if (
			doesExpConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
		) return
		dispatch(expConnectionsActions.updateSource(movingConnectionId, {
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
		const {sourceId, sourcePort} = selectExpConnection(roomState, movingConnectionId)
		const targetId = position.id
		const targetType = position.targetType
		const targetPort = position.portNumber
		if (
			doesExpConnectionBetweenNodesExist(
				roomState, sourceId, sourcePort, targetId, targetPort)
		) return
		dispatch(expConnectionsActions.updateTarget(movingConnectionId, {
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
			doesExpConnectionBetweenNodesExist(
				roomState, position.id, position.portNumber, parentNodePosition.id, port)
		) return

		dispatch(expConnectionsActions.add(new ExpConnection(
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
			doesExpConnectionBetweenNodesExist(
				roomState, parentNodePosition.id, port, position.id, position.portNumber)
		) return

		dispatch(expConnectionsActions.add(new ExpConnection(
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

	function expandToPorts(all: List<ConnectionCandidate>, current: ExpPosition): List<ConnectionCandidate> {
		const portCount = ghostConnection.activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? 1 // current.outputPortCount
			: 1 // current.inputPortCount

		return all.withMutations(mutableAll => {
			for (let i = 0; i < portCount; i++) {
				mutableAll.push(makeConnectionCandidate(current.toJS()).set('portNumber', i))
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
	const stackCountOnPort = selectExpConnectionIdsForNodeRightPort(roomState, position.id, position.portNumber).count()
	return {
		...position,
		x: position.x + position.width + (connectorWidth * (stackCountOnPort + 1)),
		y: position.y + ((position.height / (1 /*+ position.outputPortCount*/)) * (position.portNumber + 1)),
	}
}

const moveToInputPosition = (roomState: IClientRoomState) => (position: ConnectionCandidate): ConnectionCandidate => {
	const stackCountOnPort = selectExpConnectionIdsForNodeLeftPort(roomState, position.id, position.portNumber).count()
	return {
		...position,
		x: position.x - (connectorWidth * (stackCountOnPort + 1)),
		y: position.y + ((position.height / (1 /*+ position.outputPortCount*/)) * (position.portNumber + 1)),
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
