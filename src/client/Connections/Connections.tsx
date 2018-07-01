import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../../common/redux/configureStore'
import {selectAllConnectionIds} from '../../common/redux/connections-redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'

const Connections = ({connectionIds}) => (
	connectionIds.map(connectionId => {
		return (
			<ConnectedConnectionViewContainer key={connectionId} id={connectionId} />
		)
	})
)

const mapStateToProps = (state: IAppState) => ({
	connectionIds: selectAllConnectionIds(state),
})

export const ConnectionsContainer = connect(mapStateToProps)(Connections)
