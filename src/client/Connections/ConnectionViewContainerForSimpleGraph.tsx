import * as React from 'react'
import {makeConnectionPositionsSelector, selectConnection} from '../../common/redux/connections-redux'
import {shamuConnect} from '../../common/redux/redux-utils'
import {ConnectionView} from './ConnectionView'
import {
	IConnectionViewContainerAllProps, IConnectionViewContainerProps, mapStateToProps, Positions,
} from './ConnectionViewContainer'

interface IConnectionViewContainerForSimpleGraphReduxProps {
	positions: Positions
}

type IConnectionViewContainerForSimpleGraphAllProps =
	IConnectionViewContainerAllProps &
	IConnectionViewContainerForSimpleGraphReduxProps

export const ConnectionViewContainerForSimpleGraph: React.FC<IConnectionViewContainerForSimpleGraphAllProps> =
	({sourceColor, isSourceActive, isSourceSending, id, positions: {sourcePosition, targetPosition}}) =>
		sourcePosition === undefined || targetPosition === undefined
			? null
			: <ConnectionView
				color={sourceColor}
				sourceX={sourcePosition.x}
				sourceY={sourcePosition.y}
				targetX={targetPosition.x}
				targetY={targetPosition.y}
				saturateSource={isSourceActive}
				saturateTarget={isSourceSending}
				id={id}
			/>

export const ConnectedConnectionViewContainerForSimpleGraph = shamuConnect(
	() => {
		const positionsSelector = makeConnectionPositionsSelector()
		return (state, props: IConnectionViewContainerProps) => {
			return {
				...mapStateToProps(state, props),
				positions: positionsSelector(state.room, selectConnection(state.room, props.id)),
			}
		}
	},
)(ConnectionViewContainerForSimpleGraph)
