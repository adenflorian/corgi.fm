import React, {useLayoutEffect, useRef, useMemo} from 'react'
import {useSelector} from 'react-redux'
import {Map} from 'immutable'
import {
	IClientAppState, selectExpAllPositions,
} from '@corgifm/common/redux'
import {ConnectedSimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {useSingletonContext} from '../SingletonContext'
import {NodeManagerContext} from './NodeManagerContext'
import {NodeManager} from './NodeManager'

export const NodeManagerRoot = () => {
	const positionIds = useSelector((state: IClientAppState) => selectExpAllPositions(state.room))

	const singletonContext = useSingletonContext()

	const nodeManager = useMemo(() => new NodeManager(singletonContext.getAudioContext()), [singletonContext])

	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)

	useLayoutEffect(() => {
		singletonContext.setNodeManager(nodeManager)

		return () => {
			singletonContext.setNodeManager(undefined)
		}
	}, [nodeManager, singletonContext])

	// const context = useMemo(() => {
	// 	return {
	// 		subscriberThingy: {
	// 			registerAudioParam: (nodeId: Id, paramId: Id, callback: audioParamCallback) => {
	// 				audioParams.current.update(nodeId, Map<Id, audioParamCallback>(), x => x.s)
	// 			},
	// 			unregisterAudioParam: (nodeId: Id, paramId: Id) => {},
	// 		}
	// 	}
	// }, [])

	return (
		// <NodeManagerContext.Provider value={{
		// 	subscriberThingy: {
		// 	}
		// }}>
		<div className={`nodeManagerRoot viewMode-${viewMode}`}>
			{positionIds.map((_, positionId) => {
				return nodeManager.renderNodeId(positionId)
			}).toList()}
		</div>
		// </NodeManagerContext.Provider>
	)
}
