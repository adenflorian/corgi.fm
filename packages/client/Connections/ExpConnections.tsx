import React from 'react'
import {useSelector} from 'react-redux'
import {selectExpAllConnectionIds, IClientAppState} from '@corgifm/common/redux'
import {ConnectedExpConnectionView, ConnectedExpConnectionDebugView} from './ExpConnectionView'

export const ConnectedExpConnections = function _Connections() {
	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)
	const connectionIds = useSelector((state: IClientAppState) => selectExpAllConnectionIds(state.room))

	if (viewMode === 'debug') {
		return (
			<div className="debugViewConnections">
				{connectionIds.map(connectionId =>
					<ConnectedExpConnectionDebugView key={connectionId as string} id={connectionId} />,
				)}
			</div>
		)
	} else {
		return (
			<div className="connections">
				{connectionIds.map(connectionId =>
					<ConnectedExpConnectionView key={connectionId as string} id={connectionId} />,
				)}
			</div>
		)
	}
}
