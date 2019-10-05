import React from 'react'
import {ExpGhostConnections, selectExpGhostConnectionsState, shamuConnect} from '@corgifm/common/redux'
import {ConnectedExpGhostConnectionView} from './ExpGhostConnectionView'

interface Props {
}

interface ReduxProps {
	ghostConnections: ExpGhostConnections
}

export function ExpGhostConnectionsView({ghostConnections}: ReduxProps & Props) {
	return (
		<div className="connection">
			{ghostConnections.map(ghostConnection => {
				return (
					<ConnectedExpGhostConnectionView
						key={ghostConnection.id.toString()}
						id={ghostConnection.id}
					/>
				)
			}).toList()}
		</div>
	)
}

export const ConnectedExpGhostConnectionsView = shamuConnect(
	(state): ReduxProps => {
		return {
			ghostConnections: selectExpGhostConnectionsState(state.room).all,
		}
	},
)(ExpGhostConnectionsView)
