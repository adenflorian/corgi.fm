import React from 'react'
import {GhostConnections, selectGhostConnectionsState, shamuConnect, RoomType} from '@corgifm/common/redux'
import {ConnectedGhostConnectionView, ConnectedExpGhostConnectionView} from './GhostConnectionView'

interface Props {
	roomType: RoomType
}

interface ReduxProps {
	ghostConnections: GhostConnections
}

export function GhostConnectionsView({ghostConnections, roomType}: ReduxProps & Props) {
	return (
		<div className="connection">
			{ghostConnections.map(ghostConnection => {
				return (
					roomType === RoomType.Experimental
						? <ConnectedExpGhostConnectionView
							key={ghostConnection.id.toString()}
							id={ghostConnection.id}
						/>
						: <ConnectedGhostConnectionView
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
