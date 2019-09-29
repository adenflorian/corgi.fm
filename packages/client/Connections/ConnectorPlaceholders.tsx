import React from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget, calculateConnectorPositionY,
	GhostConnection, ghostConnectorActions,
	GhostConnectorAddingOrMoving, IClientAppState,
	selectLocalClientId, selectPosition, shamuConnect,
	selectNodeConnectionInfosForNode, NodeConnectionsInfo,
	selectExpPosition, selectExpNodeConnectionInfosForNode,
	RoomSettings,
} from '@corgifm/common/redux'
import {emptyList} from '@corgifm/common/common-utils'
import {connectorWidth} from './ConnectionView'
import {ConnectorPlaceholder} from './ConnectorPlaceholder'
import {expConnectionConstants, calculateExpDebugConnectorY} from './ExpConnectionView'

interface Props {
	parentId: Id
}

interface ReduxProps {
	localClientId: ClientId
	parentX: number
	parentY: number
	parentWidth: number
	parentHeight: number
	placeholdersInfo: NodeConnectionsInfo
	leftPortCount: number
	rightPortCount: number
	viewMode: RoomSettings['viewMode']
}

type AllProps = Props & ReduxProps

export const ConnectorPlaceholders =
	function _ConnectorPlaceholders(
		{
			parentId, placeholdersInfo, leftPortCount, rightPortCount,
			localClientId, parentX, parentY, parentWidth, parentHeight,
			viewMode,
		}: AllProps
	) {
		const {leftConnections, rightConnections} = placeholdersInfo
		const dispatch = useDispatch()

		const onMouseDown = (y: number, port: number) => (
			connectorPositionX: number,
			sourceOrTarget: ActiveGhostConnectorSourceOrTarget,
		) => {
			dispatch(ghostConnectorActions.create(new GhostConnection(
				{x: connectorPositionX, y},
				{parentNodeId: parentId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Adding,
				port,
			)))
		}

		const xMod = viewMode === 'debug' ? xAdjust : 0

		return (
			<div
				className="connection"
				style={{color: 'white'}}
			>
				{new Array(leftPortCount).fill(0).map((_, port) => {
					const y = viewMode === 'debug'
						? calculateExpDebugConnectorY(parentY, port)
						: calculateConnectorPositionY(parentY, parentHeight, leftPortCount, port)
					return (
						<div key={`left-${port}`}>
							<ConnectorPlaceholder
								onMouseDown={onMouseDown(y, port)}
								x={parentX + (leftConnections.get(port, emptyList).count() * -connectorWidth) - connectorWidth + xMod}
								y={y}
								sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Source}
								nodeId={parentId}
								portId={port}
							/>
						</div>
					)
				})}
				{new Array(rightPortCount).fill(0).map((_, port) => {
					const y = viewMode === 'debug'
						? calculateExpDebugConnectorY(parentY, port)
						: calculateConnectorPositionY(parentY, parentHeight, rightPortCount, port)
					return (
						<div key={`right-${port}`}>
							<ConnectorPlaceholder
								onMouseDown={onMouseDown(y, port)}
								x={parentX + parentWidth + (rightConnections.get(port, emptyList).count() * connectorWidth) - xMod}
								y={y}
								sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Target}
								nodeId={parentId}
								portId={port}
							/>
						</div>
					)
				})}
			</div>
		)
	}

const mapStateToProps = (state: IClientAppState, props: Props): ReduxProps => {
	const parentPosition = selectPosition(state.room, props.parentId)
	return {
		placeholdersInfo: selectNodeConnectionInfosForNode(state.room, props.parentId),
		localClientId: selectLocalClientId(state),
		parentX: parentPosition.x,
		parentY: parentPosition.y,
		parentWidth: parentPosition.width,
		parentHeight: parentPosition.height,
		leftPortCount: parentPosition.inputPortCount,
		rightPortCount: parentPosition.outputPortCount,
		viewMode: 'normal'
	}
}

export const ConnectedConnectorPlaceholders = shamuConnect(
	mapStateToProps,
)(ConnectorPlaceholders)

type PPProps = Props & {
	readonly inputAudioPortCount: number
	readonly outputAudioPortCount: number
}

const {xAdjust} = expConnectionConstants

export const ConnectedExpConnectorPlaceholders = (React.memo(function _ConnectedExpConnectorPlaceholders(props: PPProps) {
	const parentPosition = useSelector((state: IClientAppState) => selectExpPosition(state.room, props.parentId))
	const placeholdersInfo = useSelector((state: IClientAppState) => selectExpNodeConnectionInfosForNode(state.room, props.parentId))
	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))
	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)

	return (
		<ConnectorPlaceholders
			parentId={props.parentId}
			placeholdersInfo={placeholdersInfo}
			localClientId={localClientId}
			parentX={parentPosition.x}
			parentY={parentPosition.y}
			parentWidth={parentPosition.width}
			parentHeight={parentPosition.height}
			leftPortCount={props.inputAudioPortCount}
			rightPortCount={props.outputAudioPortCount}
			viewMode={viewMode}
		/>
	)
}))
