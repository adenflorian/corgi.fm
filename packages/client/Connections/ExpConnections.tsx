import React from 'react'
import {shamuConnect, selectExpAllConnectionIds} from '@corgifm/common/redux'
import {ConnectedExpConnectionView} from './ExpConnectionView'

export enum ConnectionsUsage {
	normal = 'normal',
	simpleGraph = 'simpleGraph',
}

interface IConnectionsProps {}

interface IConnectionsReduxProps {
	connectionIds: Id[]
}

type IConnectionsAllProps = IConnectionsProps & IConnectionsReduxProps

export const Connections = function _Connections({connectionIds}: IConnectionsAllProps) {
	return (
		<div className="connections">
			{connectionIds.map(connectionId =>
				<ConnectedExpConnectionView key={connectionId.toString()} id={connectionId} />,
			)}
		</div>
	)
}

export const ConnectedExpConnections = shamuConnect(
	(state): IConnectionsReduxProps => ({
		connectionIds: selectExpAllConnectionIds(state.room),
	}),
)(Connections)
