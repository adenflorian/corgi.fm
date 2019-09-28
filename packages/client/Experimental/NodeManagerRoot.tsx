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
		<div className="nodeManagerRoot">
			{positionIds.map((_, positionId) =>
				<ConnectedSimpleGraphNodeExp
					key={positionId as string}
					positionId={positionId}
				>
					{nodeManager.renderNodeId(positionId)}
				</ConnectedSimpleGraphNodeExp>
			).toList()}
		</div>
		// </NodeManagerContext.Provider>
	)
}
