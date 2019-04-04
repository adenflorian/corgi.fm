import * as React from 'react'
import {
	GhostConnectorRecord, IPosition,
	selectConnection, selectConnectionSourceColor,
	selectConnectionSourceIsActive,
	selectConnectionSourceIsSending, selectConnectionStackOrderForSource,
	selectConnectionStackOrderForTarget, selectPosition, shamuConnect,
	getConnectionNodeInfo,
} from '../../common/redux'
import {ConnectedConnectionView} from './ConnectionView'

interface IConnectionViewContainerProps {
	id: string
}

interface IConnectionViewContainerReduxProps {
	sourcePosition: IPosition
	targetPosition: IPosition
	sourceStackOrder: number
	targetStackOrder: number
	sourceColor: string
	isSourceActive: boolean
	isSourceSending: boolean
	isSourcePlaying: boolean
	ghostConnector: GhostConnectorRecord
}

type IConnectionViewContainerAllProps =
	IConnectionViewContainerProps &
	IConnectionViewContainerReduxProps

export const ConnectionViewContainer: React.FC<IConnectionViewContainerAllProps> =
	function _ConnectionViewContainer({
		sourceStackOrder, targetStackOrder, sourceColor,
		isSourceActive, isSourceSending, id,
		sourcePosition, targetPosition, ghostConnector, isSourcePlaying,
	}) {
		return <ConnectedConnectionView
			color={sourceColor}
			isSourcePlaying={isSourcePlaying}
			sourceX={sourcePosition.x + sourcePosition.width}
			sourceY={sourcePosition.y + (sourcePosition.height / 2)}
			targetX={targetPosition.x}
			targetY={targetPosition.y + (targetPosition.height / 2)}
			ghostConnector={ghostConnector}
			saturateSource={isSourceActive || isSourceSending}
			saturateTarget={isSourceSending}
			id={id}
			targetStackOrder={targetStackOrder}
			sourceStackOrder={sourceStackOrder}
		/>
	}

export const ConnectedConnectionViewContainer = shamuConnect(
	(state, props: IConnectionViewContainerProps): IConnectionViewContainerReduxProps => {
		const connection = selectConnection(state.room, props.id)
		const isSourceSending = selectConnectionSourceIsSending(state.room, connection.id)
		const isSourceActive =
			isSourceSending || selectConnectionSourceIsActive(state.room, connection.id)
		const sourcePosition = selectPosition(state.room, connection.sourceId)
		const targetPosition = selectPosition(state.room, connection.targetId)
		const sourceColor = selectConnectionSourceColor(state.room, props.id)

		return {
			sourceColor,
			isSourceActive,
			isSourceSending,
			isSourcePlaying: getConnectionNodeInfo(connection.sourceType)
				.selectIsPlaying(state.room, connection.sourceId),
			ghostConnector: connection.ghostConnector,
			sourcePosition,
			targetPosition,
			sourceStackOrder: selectConnectionStackOrderForSource(state.room, props.id),
			targetStackOrder: selectConnectionStackOrderForTarget(state.room, props.id),
		}
	},
)(ConnectionViewContainer)
