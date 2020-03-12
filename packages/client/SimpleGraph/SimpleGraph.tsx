import React, {Fragment} from 'react'
import {
	selectAllPositions, IClientAppState, selectClientInfo,
} from '@corgifm/common/redux'
import {useSelector} from 'react-redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedConnections} from '../Connections/Connections'
import {ConnectedConnectorPlaceholders} from '../Connections/ConnectorPlaceholders'
import {ConnectedGhostConnectionsView} from '../Connections/GhostConnections'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {ConnectedZoom} from './Zoom'

export const ConnectedSimpleGraph = function _ConnectedSimpleGraph() {
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
					<PositionsStuff />
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
