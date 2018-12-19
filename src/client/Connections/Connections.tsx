import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllConnectionIds} from '../../common/redux/connections-redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'

interface IConnectionsProps {
	connectionIds: string[]
}

const Connections = ({connectionIds}: IConnectionsProps) => (
	<div className="connections" style={{display: 'flex'}}>
		{connectionIds.map(connectionId => (
			<ConnectedConnectionViewContainer key={connectionId} id={connectionId} />
		))}
	</div>
)

const mapStateToProps = (state: IClientAppState): IConnectionsProps => ({
	connectionIds: selectAllConnectionIds(state.room),
})

export const ConnectionsContainer = connect(mapStateToProps)(Connections)
