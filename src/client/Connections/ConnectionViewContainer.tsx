import * as React from 'react'
import {Point} from '../../common/common-types'
import {
	GhostConnectorRecord, makeConnectionPositionsSelector,
	selectConnection,
	selectConnectionSourceIsActive, selectConnectionSourceIsSending,
	selectConnectionStackOrderForSource,
	selectConnectionStackOrderForTarget, selectPosition, shamuConnect,
} from '../../common/redux'
import {CssColor} from '../../common/shamu-color'
import {ConnectedConnectionView} from './ConnectionView'

interface IConnectionViewContainerProps {
	id: string
}

interface IConnectionViewContainerReduxProps {
	sourcePosition: Point
	targetPosition: Point
	sourceStackOrder: number
	targetStackOrder: number
	sourceColor: string
	isSourceActive: boolean
	isSourceSending: boolean
	ghostConnector: GhostConnectorRecord
}

type IConnectionViewContainerAllProps =
	IConnectionViewContainerProps &
	IConnectionViewContainerReduxProps

export const ConnectionViewContainer: React.FC<IConnectionViewContainerAllProps> =
	({
		sourceStackOrder, targetStackOrder, sourceColor, isSourceActive, isSourceSending, id,
		sourcePosition, targetPosition, ghostConnector,
	}) =>
		<ConnectedConnectionView
			color={sourceColor}
			sourcePosition={sourcePosition}
			targetPosition={targetPosition}
			ghostConnector={ghostConnector}
			saturateSource={isSourceActive || isSourceSending}
			saturateTarget={isSourceSending}
			id={id}
			targetStackOrder={targetStackOrder}
			sourceStackOrder={sourceStackOrder}
		/>

export const ConnectedConnectionViewContainer = shamuConnect(
	() => {
		const positionsSelector = makeConnectionPositionsSelector()

		return (state, props: IConnectionViewContainerProps): IConnectionViewContainerReduxProps => {
			const connection = selectConnection(state.room, props.id)
			const sourceColor = selectPosition(state.room, connection.sourceId).color
			const isSourceActive = selectConnectionSourceIsActive(state.room, connection.id)
			const isSourceSending = selectConnectionSourceIsSending(state.room, connection.id)
			const positions = positionsSelector(state.room, connection)

			return {
				sourceColor,
				isSourceActive,
				isSourceSending,
				ghostConnector: connection.ghostConnector,
				sourcePosition: positions.sourcePosition,
				targetPosition: positions.targetPosition,
				sourceStackOrder: selectConnectionStackOrderForSource(state.room, props.id),
				targetStackOrder: selectConnectionStackOrderForTarget(state.room, props.id),
			}
		}
	},
)(ConnectionViewContainer)
