import React from 'react'
import {Dispatch} from 'redux'
import {ClientId, Point} from '../../common/common-types'
import {
	ActiveGhostConnectorSourceOrTarget, GhostConnection, ghostConnectorActions,
	GhostConnectorAddingOrMoving, selectConnectionsWithSourceIds, selectConnectionsWithTargetIds,
	selectLocalClientId,
	shamuConnect,
} from '../../common/redux'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	parentId: string
	parentPosition: Point
	parentSize: Point
}

interface ReduxProps {
	leftConnections: number
	rightConnections: number
	localClientId: ClientId
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export const ConnectorPlaceholders =
	function _ConnectorPlaceholders({
		parentPosition, parentSize, leftConnections, rightConnections, dispatch, parentId,
		localClientId,
	}: AllProps) {

		function onMouseDown(
			connectorPositionX: number,
			sourceOrTarget: ActiveGhostConnectorSourceOrTarget,
		) {
			dispatch(ghostConnectorActions.create(new GhostConnection(
				{x: connectorPositionX, y: parentPosition.y + relativePosition.y},
				{parentNodeId: parentId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Adding,
			)))
		}

		const relativePosition = Object.freeze({
			xLeft: (leftConnections * -connectorWidth) - connectorWidth,
			xRight: parentSize.x + (rightConnections * connectorWidth),
			y: parentSize.y / 2,
		})

		return (
			<div className="connection" style={{color: 'orange'}}>
				<div>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
						saturate={false}
						x={relativePosition.xLeft}
						y={relativePosition.y}
						svgProps={{
							className: 'newConnectionPlaceholder',
							onMouseDown: e => e.button === 0 && onMouseDown(
								parentPosition.x + relativePosition.xLeft,
								ActiveGhostConnectorSourceOrTarget.Source,
							),
						}}
					/>
				</div>
				<div>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
						saturate={false}
						x={relativePosition.xRight}
						y={relativePosition.y}
						svgProps={{
							className: 'newConnectionPlaceholder',
							onMouseDown: e => e.button === 0 && onMouseDown(
								parentPosition.x + relativePosition.xRight,
								ActiveGhostConnectorSourceOrTarget.Target,
							),
						}}
					/>
				</div>
			</div>
		)
	}

export const ConnectedConnectorPlaceholders = shamuConnect(
	(state, {parentId}: Props): ReduxProps => {
		return {
			leftConnections: selectConnectionsWithTargetIds(state.room, [parentId]).count(),
			rightConnections: selectConnectionsWithSourceIds(state.room, [parentId]).count(),
			localClientId: selectLocalClientId(state),
		}
	},
)(ConnectorPlaceholders)
