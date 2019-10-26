import React from 'react'
import {useSelector} from 'react-redux'
import {hot} from 'react-hot-loader'
import {
	IClientAppState, selectExpAllPositions,
} from '@corgifm/common/redux'
import {useSingletonContext} from '../SingletonContext'
import {ConnectedExpConnections} from '../Connections/ExpConnections'
import {logger} from '../client-logger'
import {ConnectedExpGhostConnectionsView} from '../Connections/ExpGhostConnections'

export const NodeManagerRoot = hot(module)(React.memo(() => {
	const positionIds = useSelector((state: IClientAppState) => selectExpAllPositions(state.room))

	const singletonContext = useSingletonContext()

	const nodeManager = singletonContext.getNodeManager()

	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)

	if (!nodeManager) {
		logger.error('missing nodeManager in NodeManagerRoot!')
		return null
	}

	return (
		<div className={`nodeManagerRoot viewMode-${viewMode}`}>
			{positionIds.map((_, positionId) => {
				return nodeManager.renderNodeId(positionId)
			}).toList()}
			{/* Render connections after some the connectors render on top of nodes */}
			<ConnectedExpConnections />
			<ConnectedExpGhostConnectionsView />
		</div>
	)
}))
