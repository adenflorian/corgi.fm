import React from 'react'
import {useSelector} from 'react-redux'
import {selectExpAllConnectionIds, IClientAppState} from '@corgifm/common/redux'
import {ExpConnectionView} from './ExpConnectionView'

export const ConnectedExpConnections = function _Connections() {
	const connectionIds = useSelector((state: IClientAppState) => selectExpAllConnectionIds(state.room))

	return (
		<div className="debugViewConnections">
			{connectionIds.map(connectionId =>
				<ExpConnectionView key={connectionId as string} id={connectionId} />
			)}
		</div>
	)
}
