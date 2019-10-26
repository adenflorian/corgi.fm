import React from 'react'
import {useSelector} from 'react-redux'
import {hot} from 'react-hot-loader'
import {
	IClientAppState, selectExpNodesState, selectExpAllConnections,
} from '@corgifm/common/redux'
import {useSingletonContext} from '../SingletonContext'
import {logger} from '../client-logger'
import {ConnectedExpGhostConnectionsView} from '../Connections/ExpGhostConnections'
import {useLocalRoomMember} from '../react-hooks'
import {ConnectedExpConnectionView} from '../Connections/ExpConnectionView'

export const NodeManagerRoot = hot(module)(React.memo(() => {
	const nodes = useSelector((state: IClientAppState) => selectExpNodesState(state.room))

	const singletonContext = useSingletonContext()

	const nodeManager = singletonContext.getNodeManager()

	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)

	const currentGroupId = useLocalRoomMember().groupNodeId

	const connections = useSelector((state: IClientAppState) => selectExpAllConnections(state.room))

	if (!nodeManager) {
		logger.error('missing nodeManager in NodeManagerRoot!')
		return null
	}

	return (
		<div className={`nodeManagerRoot viewMode-${viewMode}`}>
			{nodes.filter(x => x.groupId === currentGroupId).map((_, nodeId) => {
				return nodeManager.renderNodeId(nodeId)
			}).toList()}
			{/* Render connections after some the connectors render on top of nodes */}
			<div className="debugViewConnections">
				{connections.filter(x => x.groupId === currentGroupId).map(connection =>
					<ConnectedExpConnectionView key={connection.id} id={connection.id} />
				).toList()}
			</div>
			<ConnectedExpGhostConnectionsView />
		</div>
	)
}))
