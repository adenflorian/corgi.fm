import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllPositionIds} from '../../common/redux/positions-redux'
import {ConnectionsContainer} from '../Connections/Connections'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {Zoom} from './Zoom'

interface ISimpleGraphReduxProps {
	positionIds: string[]
}

export const SimpleGraph: React.FC<ISimpleGraphReduxProps> =
	({positionIds}) =>
		<div className="simpleGraph">
			<Zoom>
				<ConnectionsContainer />
				<p>hello world, this is graph</p>
				{positionIds.map(positionId =>
					<ConnectedSimpleGraphNode key={positionId} positionId={positionId} />,
				)}
			</Zoom>
		</div>

export const ConnectedSimpleGraph = connect(
	(state: IClientAppState): ISimpleGraphReduxProps => ({
		positionIds: selectAllPositionIds(state.room),
	}),
)(SimpleGraph)
