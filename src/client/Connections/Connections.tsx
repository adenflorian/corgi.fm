import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../../common/redux/client-store'
import {selectAllConnectionIds} from '../../common/redux/connections-redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'

const Connections = ({connectionIds}) => (
	<div className="connections" style={{display: 'flex'}}>
		{connectionIds.map(connectionId => (
			<ConnectedConnectionViewContainer key={connectionId} id={connectionId} />
		))}
	</div>
)

const mapStateToProps = (state: IAppState) => ({
	connectionIds: selectAllConnectionIds(state),
})

export const ConnectionsContainer = connect(mapStateToProps)(Connections)
