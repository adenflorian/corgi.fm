import React from 'react'
import {selectAllConnectionIds, IClientAppState, selectOption, AppOptions} from '@corgifm/common/redux'
import {ConnectedConnectionView} from './ConnectionView'
import {useSelector} from 'react-redux'

export const Connections = React.memo(function _Connections() {

	const enableWireShadows = useSelector((state: IClientAppState) => selectOption(state, AppOptions.enableWireShadows))

	const connectionIds = useSelector((state: IClientAppState) => selectAllConnectionIds(state.room))
	
	return (
		<div className={`connections enableWireShadows-${enableWireShadows}`}>
			{connectionIds.map(connectionId =>
				<ConnectedConnectionView key={connectionId.toString()} id={connectionId} />,
			)}
		</div>
	)
})
