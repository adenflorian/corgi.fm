import {Seq} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux'
import {selectAllPositionIds} from '../../common/redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedConnections, ConnectionsUsage} from '../Connections/Connections'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {ConnectedZoom} from './Zoom'

interface ISimpleGraphReduxProps {
	positionIds: Seq.Indexed<string>
}

export const SimpleGraph: React.FC<ISimpleGraphReduxProps> =
	React.memo(({positionIds}) =>
		<div
			className="simpleGraph"
			style={{
				position: 'fixed',
				width: 0,
				height: 0,
				margin: '50vh 50vw',
			}}
		>
			<ConnectedZoom>
				<div id={mainBoardsId} className="boards">
					<ConnectedConnections usage={ConnectionsUsage.simpleGraph} />
					{positionIds.map(positionId =>
						<ConnectedSimpleGraphNode key={positionId} positionId={positionId} />,
					)}
				</div>
			</ConnectedZoom>
		</div>,
		// TODO
		// (prev, next) => {
		// 	return next.positionIds.count() === prev.positionIds.count()
		// },
	)

export const ConnectedSimpleGraph = connect(
	(state: IClientAppState): ISimpleGraphReduxProps => ({
		positionIds: selectAllPositionIds(state.room),
	}),
)(SimpleGraph)
