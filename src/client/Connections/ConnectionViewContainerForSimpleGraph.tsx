import * as React from 'react'
import {makeConnectionPositionsSelector, selectConnection, selectConnectionStackOrderForSource, selectConnectionStackOrderForTarget, shamuConnect} from '../../common/redux'
import {ConnectedConnectionView} from './ConnectionView'
import {IConnectionViewContainerAllProps, IConnectionViewContainerProps, mapStateToProps, Positions} from './ConnectionViewContainer'

interface IConnectionViewContainerForSimpleGraphReduxProps {
	positions: Positions
	sourceStackOrder: number
	targetStackOrder: number
}

type IConnectionViewContainerForSimpleGraphAllProps =
	IConnectionViewContainerAllProps &
	IConnectionViewContainerForSimpleGraphReduxProps

export const ConnectionViewContainerForSimpleGraph: React.FC<IConnectionViewContainerForSimpleGraphAllProps> =
	React.memo(({
		sourceStackOrder, targetStackOrder, sourceColor, isSourceActive, isSourceSending, id,
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
				targetStackOrder={targetStackOrder}
				sourceStackOrder={sourceStackOrder}
			/>,
	)

export const ConnectedConnectionViewContainerForSimpleGraph = shamuConnect(
	() => {
		const positionsSelector = makeConnectionPositionsSelector()
		return (state, props: IConnectionViewContainerProps) => {
			return {
				...mapStateToProps(state, props),
				positions: positionsSelector(state.room, selectConnection(state.room, props.id)),
				sourceStackOrder: selectConnectionStackOrderForSource(state.room, props.id),
				targetStackOrder: selectConnectionStackOrderForTarget(state.room, props.id),
			}
		}
	},
)(ConnectionViewContainerForSimpleGraph)
