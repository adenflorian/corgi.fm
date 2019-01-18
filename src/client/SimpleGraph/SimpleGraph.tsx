import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllPositionIds} from '../../common/redux/positions-redux'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'

interface ISimpleGraphReduxProps {
	positionIds: string[]
}

export const SimpleGraph: React.FunctionComponent<ISimpleGraphReduxProps> =
	({positionIds}) =>
		<div className="simpleGraph">
			<p>hello world, this is graph</p>
			{positionIds.map(positionId =>
				<ConnectedSimpleGraphNode key={positionId} positionId={positionId} />,
			)}
		</div>

export const ConnectedSimpleGraph = connect(
	(state: IClientAppState): ISimpleGraphReduxProps => ({
		positionIds: selectAllPositionIds(state.room),
	}),
)(SimpleGraph)
