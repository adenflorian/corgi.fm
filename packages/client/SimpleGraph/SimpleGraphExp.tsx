import React from 'react'
import {
	IClientAppState, RoomType, selectClientInfo,
} from '@corgifm/common/redux'
import {useSelector} from 'react-redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {NodeManagerRoot} from '../Experimental/NodeManagerRoot'
import {NodeManagerContext} from '../Experimental/NodeManager'
import {useSingletonContext} from '../SingletonContext'
import {logger} from '../client-logger'
import {ConnectedZoom} from './Zoom'

export const ConnectedSimpleGraphExp = function _ConnectedSimpleGraphExp() {
	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)
	const isClientReady = useSelector((state: IClientAppState) => selectClientInfo(state).isClientReady)

	const singletonContext = useSingletonContext()

	const nodeManager = singletonContext.getNodeManager()

	if (!nodeManager) {
		logger.error('missing nodeManager in ConnectedSimpleGraphExp!')
		return null
	}

	return (
		<NodeManagerContext.Provider value={nodeManager.reactContext}>
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
						{roomType === RoomType.Experimental && isClientReady &&
							<NodeManagerRoot />}
					</div>
				</ConnectedZoom>
			</div>
		</NodeManagerContext.Provider>
	)
}
