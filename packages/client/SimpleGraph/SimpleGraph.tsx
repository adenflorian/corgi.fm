import {Seq} from 'immutable'
import React from 'react'
import {shamuConnect, selectAllPositionIds} from '@corgifm/common/redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedConnections} from '../Connections/Connections'
import {ConnectedConnectorPlaceholders} from '../Connections/ConnectorPlaceholders'
import {ConnectedGhostConnectionsView} from '../Connections/GhostConnections'
import {ECSCanvasRenderSystem} from '../ECS/ECSCanvasRenderSystem'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {ConnectedZoom} from './Zoom'

interface ISimpleGraphReduxProps {
	positionIds: Seq.Indexed<Id>
}

const canvasSize = ECSCanvasRenderSystem.canvasSize

export const SimpleGraph =
	function _SimpleGraph({positionIds}: ISimpleGraphReduxProps) {
		return (
			<div
				className="simpleGraph"
				style={{
					position: 'fixed',
					width: 0,
					height: 0,
					margin: '50vh 50vw',
				}}
			>
				<ConnectedZoom>
					<div id={mainBoardsId} className="boards">
						<ConnectedMousePointers />
						<ConnectedConnections />
						<ConnectedGhostConnectionsView />
						{positionIds.map(positionId =>
							<ConnectedConnectorPlaceholders
								key={positionId.toString()}
								parentId={positionId}
							/>,
						)}
						{positionIds.map(positionId =>
							<ConnectedSimpleGraphNode
								key={positionId.toString()}
								positionId={positionId}
							/>,
						)}
						<canvas
							id="ECSCanvasRenderSystemCanvas"
							style={{
								position: 'absolute',
								width: canvasSize,
								height: canvasSize,
								top: -canvasSize / 2,
								left: -canvasSize / 2,
								pointerEvents: 'none',
							}}
							width={canvasSize}
							height={canvasSize}
						/>
					</div>
				</ConnectedZoom>
			</div>
		)
		// TODO Only update if IDs actually changed
		// (prev, next) => {
		// 	return next.positionIds.count() === prev.positionIds.count()
		// },
	}

export const ConnectedSimpleGraph = shamuConnect(
	(state): ISimpleGraphReduxProps => ({
		positionIds: selectAllPositionIds(state.room),
	}),
)(SimpleGraph)
