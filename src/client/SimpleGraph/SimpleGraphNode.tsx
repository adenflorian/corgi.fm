import * as React from 'react'
import {selectPosition} from '../../common/redux/positions-redux'
import {shamuConnect} from '../../common/redux/redux-utils'

interface ISimpleGraphNodeProps {
	positionId: string
}

interface ISimpleGraphNodeReduxProps {
	x: number,
	y: number
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps

export const SimpleGraphNode: React.FunctionComponent<ISimpleGraphNodeAllProps> =
	({positionId, x, y}) =>
		<div
			className="simpleGraphNode"
			style={{
				position: 'absolute',
				top: y + 'px',
				left: x + 'px',
			}}
		>
			<p>hello world, this is a simple graph node: {positionId}</p>
		</div>

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId) || {x: 0, y: 0}

		return {
			x: position.x,
			y: position.y,
		}
	},
)(SimpleGraphNode)
