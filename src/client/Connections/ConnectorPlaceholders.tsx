import React from 'react'
import {Dispatch} from 'redux'
import {ClientId} from '../../common/common-types'
import {
	ActiveGhostConnectorSourceOrTarget, GhostConnection, ghostConnectorActions,
	GhostConnectorAddingOrMoving, IPosition, selectConnectionsWithSourceIds,
	selectConnectionsWithTargetIds,
	selectLocalClientId, selectPosition, shamuConnect,
} from '../../common/redux'
import {connectorWidth} from './ConnectionView'
import {ConnectorPlaceholder} from './ConnectorPlaceholder'

interface Props {
	parentId: string
}

interface ReduxProps {
	leftConnections: number
	rightConnections: number
	localClientId: ClientId
	parentPosition: IPosition
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export const ConnectorPlaceholders =
	function _ConnectorPlaceholders({
		parentPosition, leftConnections, rightConnections, dispatch, parentId,
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
			xRight: parentPosition.width + (rightConnections * connectorWidth),
			y: parentPosition.height / 2,
		})

		return (
			<div
				className="connection"
				style={{color: 'white'}}
			>
				<div>
					<ConnectorPlaceholder
						onMouseDown={onMouseDown}
						x={parentPosition.x + relativePosition.xLeft}
						y={parentPosition.y + relativePosition.y}
						sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Source}
					/>
				</div>
				<div>
					<ConnectorPlaceholder
						onMouseDown={onMouseDown}
						x={parentPosition.x + relativePosition.xRight}
						y={parentPosition.y + relativePosition.y}
						sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Target}
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
			parentPosition: selectPosition(state.room, parentId),
		}
	},
)(ConnectorPlaceholders)
