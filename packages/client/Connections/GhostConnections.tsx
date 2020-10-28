import React from 'react'
import {GhostConnections, selectGhostConnectionsState, shamuConnect} from '@corgifm/common/redux'
import {ConnectedGhostConnectionView} from './GhostConnectionView'

interface Props {
}

interface ReduxProps {
	ghostConnections: GhostConnections
}

export function GhostConnectionsView({ghostConnections}: ReduxProps & Props) {
	return (
		<div className="connection">
			{ghostConnections.map(ghostConnection => {
				return (
					<ConnectedGhostConnectionView
						key={ghostConnection.id.toString()}
						id={ghostConnection.id}
					/>
				)
			}).toList()}
		</div>
	)
}

export const ConnectedGhostConnectionsView = shamuConnect(
	(state): ReduxProps => {
		return {
			ghostConnections: selectGhostConnectionsState(state.room).all,
		}
	},
)(GhostConnectionsView)
