import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllConnectionIds} from '../../common/redux/connections-redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'
import {ConnectedConnectionViewContainerForSimpleGraph} from './ConnectionViewContainerForSimpleGraph'

export enum ConnectionsUsage {
	normal = 'normal',
	simpleGraph = 'simpleGraph',
}

interface IConnectionsProps {
	usage: ConnectionsUsage
}

interface IConnectionsReduxProps {
	connectionIds: string[]
}

type IConnectionsAllProps = IConnectionsProps & IConnectionsReduxProps

export const Connections = ({connectionIds, usage}: IConnectionsAllProps) => {
	const ConnectionViewContainerComp = getComponentForUsage(usage)

	return <div className="connections" style={{display: 'flex'}}>
		{connectionIds.map(connectionId =>
			<ConnectionViewContainerComp key={connectionId} id={connectionId} />,
		)}
	</div>
}

function getComponentForUsage(usage: ConnectionsUsage) {
	switch (usage) {
		case ConnectionsUsage.normal: return ConnectedConnectionViewContainer
		case ConnectionsUsage.simpleGraph: return ConnectedConnectionViewContainerForSimpleGraph
		default: throw new Error('usage not yet implemented: ' + usage)
	}
}

export const ConnectedConnections = connect(
	(state: IClientAppState): IConnectionsReduxProps => ({
		connectionIds: selectAllConnectionIds(state.room),
	}),
)(Connections)
