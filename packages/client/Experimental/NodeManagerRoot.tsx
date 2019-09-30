import React, {useLayoutEffect, useMemo} from 'react'
import {useSelector} from 'react-redux'
import {
	IClientAppState, selectExpAllPositions, RoomType,
} from '@corgifm/common/redux'
import {useSingletonContext} from '../SingletonContext'
import {ConnectedGhostConnectionsView} from '../Connections/GhostConnections'
import {ConnectedExpConnections} from '../Connections/ExpConnections'
import {NodeManager, NodeManagerContext} from './NodeManager'

export const NodeManagerRoot = () => {
	const positionIds = useSelector((state: IClientAppState) => selectExpAllPositions(state.room))

	const singletonContext = useSingletonContext()

	const nodeManager = useMemo(() => new NodeManager(
		singletonContext.getAudioContext(),
		singletonContext.getPreMasterLimiter()
	), [singletonContext])

	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)

	useLayoutEffect(() => {
		singletonContext.setNodeManager(nodeManager)

		return () => {
			singletonContext.setNodeManager(undefined)
		}
	}, [nodeManager, singletonContext])

	return (
		<NodeManagerContext.Provider value={nodeManager.reactContext}>
			<div className={`nodeManagerRoot viewMode-${viewMode}`}>
				<ConnectedExpConnections />
				<ConnectedGhostConnectionsView roomType={RoomType.Experimental} />
				{positionIds.map((_, positionId) => {
					return nodeManager.renderNodeId(positionId)
				}).toList()}
			</div>
		</NodeManagerContext.Provider>
	)
}
