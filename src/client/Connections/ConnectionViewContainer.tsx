import * as React from 'react'
import {Point} from '../../common/common-types'
import {
	GhostConnectorRecord, makeConnectionPositionsSelector,
	selectConnection, selectConnectionSourceColor,
	selectConnectionSourceIsActive, selectConnectionSourceIsSending,
	selectConnectionStackOrderForSource,
	selectConnectionStackOrderForTarget, shamuConnect,
} from '../../common/redux'
import {ConnectedConnectionView} from './ConnectionView'

interface IConnectionViewContainerProps {
	id: string
}

interface IConnectionViewContainerReduxProps {
	sourcePosition: Point
	targetPosition: Point
	sourceStackOrder: number
	targetStackOrder: number
	sourceId?: string
	targetId?: string
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
			const sourceColor = selectConnectionSourceColor(state.room, connection.id)
			const isSourceActive = selectConnectionSourceIsActive(state.room, connection.id)
			const isSourceSending = selectConnectionSourceIsSending(state.room, connection.id)
			const positions = positionsSelector(state.room, connection)

			return {
				sourceId: connection.sourceId,
				targetId: connection.targetId,
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
