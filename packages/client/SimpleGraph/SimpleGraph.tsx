import React, {Fragment} from 'react'
import {
	selectAllPositions, IClientAppState, RoomType, selectClientInfo,
} from '@corgifm/common/redux'
import {useSelector} from 'react-redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedConnections} from '../Connections/Connections'
import {ConnectedConnectorPlaceholders} from '../Connections/ConnectorPlaceholders'
import {ConnectedGhostConnectionsView} from '../Connections/GhostConnections'
import {ECSCanvasRenderSystem} from '../ECS/ECSCanvasRenderSystem'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {NodeManagerRoot} from '../Experimental/NodeManagerRoot'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {ConnectedZoom} from './Zoom'

const canvasSize = ECSCanvasRenderSystem.canvasSize

export const ConnectedSimpleGraph = function _ConnectedSimpleGraph() {
	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)
	const isClientReady = useSelector((state: IClientAppState) => selectClientInfo(state).isClientReady)

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
					{roomType !== RoomType.Experimental &&
						<ConnectedConnections />}
					{roomType !== RoomType.Experimental &&
						<ConnectedGhostConnectionsView />}
					{roomType === RoomType.Experimental
						? (isClientReady ? <NodeManagerRoot /> : null)
						: <PositionsStuff />}
					{/* <canvas
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
					/> */}
				</div>
			</ConnectedZoom>
		</div>
	)
}

function PositionsStuff() {
	const positionIds = useSelector((state: IClientAppState) => selectAllPositions(state.room))

	return (
		<Fragment>
			{positionIds.map((_, positionId) =>
				<Fragment key={positionId as string}>
					<ConnectedConnectorPlaceholders
						parentId={positionId}
					/>
					<ConnectedSimpleGraphNode
						positionId={positionId}
					/>
				</Fragment>
			).toList()}
		</Fragment>
	)
}
