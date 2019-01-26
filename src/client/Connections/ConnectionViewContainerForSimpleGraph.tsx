import * as React from 'react'
import {selectConnection} from '../../common/redux/connections-redux'
import {makeConnectionPositionsSelector} from '../../common/redux/positions-redux'
import {shamuConnect} from '../../common/redux/redux-utils'
import {ConnectedConnectionView} from './ConnectionView'
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
	({
		sourceColor, isSourceActive, isSourceSending, id,
		positions: {sourcePosition, targetPosition}, ghostConnector,
	}) =>
		sourcePosition === undefined || targetPosition === undefined
			? null
			: <ConnectedConnectionView
				color={sourceColor}
				sourceX={sourcePosition.x}
				sourceY={sourcePosition.y}
				targetX={targetPosition.x}
				targetY={targetPosition.y}
				ghostConnector={ghostConnector}
				saturateSource={isSourceActive || isSourceSending}
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
