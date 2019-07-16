import React from 'react'
import {selectAllConnectionIds, shamuConnect} from '@corgifm/common/redux'
import {ConnectedConnectionView} from './ConnectionView'

export enum ConnectionsUsage {
	normal = 'normal',
	simpleGraph = 'simpleGraph',
}

interface IConnectionsProps {}

interface IConnectionsReduxProps {
	connectionIds: string[]
}

type IConnectionsAllProps = IConnectionsProps & IConnectionsReduxProps

export const Connections = function _Connections({connectionIds}: IConnectionsAllProps) {
	return (
		<div className="connections">
			{connectionIds.map(connectionId =>
				<ConnectedConnectionView key={connectionId} id={connectionId} />,
			)}
		</div>
	)
}

export const ConnectedConnections = shamuConnect(
	(state): IConnectionsReduxProps => ({
		connectionIds: selectAllConnectionIds(state.room),
	}),
)(Connections)
