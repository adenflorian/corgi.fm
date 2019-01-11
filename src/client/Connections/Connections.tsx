import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllConnectionIds} from '../../common/redux/connections-redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'

interface IConnectionsProps {
	connectionIds: string[]
}

export const Connections = ({connectionIds}: IConnectionsProps) =>
	<div className="connections" style={{display: 'flex'}}>
		{connectionIds.map(connectionId => (
			<ConnectedConnectionViewContainer key={connectionId} id={connectionId} />
		))}
	</div>

export const ConnectionsContainer = connect(
	(state: IClientAppState): IConnectionsProps => ({
		connectionIds: selectAllConnectionIds(state.room),
	}),
)(Connections)
