import React from 'react'
import {useDispatch} from 'react-redux'
import {ClientId} from '@corgifm/common/common-types'
import {
	ActiveGhostConnectorSourceOrTarget, calculateConnectorPositionY, createSelectPlaceholdersInfo,
	GhostConnection, ghostConnectorActions,
	GhostConnectorAddingOrMoving, IClientAppState,
	selectLocalClientId, selectPosition, shamuConnect,
} from '@corgifm/common/redux'
import {connectorWidth} from './ConnectionView'
import {ConnectorPlaceholder} from './ConnectorPlaceholder'

interface Props {
	parentId: string
}

interface ReduxProps {
	localClientId: ClientId
	parentX: number
	parentY: number
	parentWidth: number
	parentHeight: number
	placeholdersInfo: ReturnType<ReturnType<typeof createSelectPlaceholdersInfo>>
	leftPortCount: number
	rightPortCount: number
}

type AllProps = Props & ReduxProps

export const ConnectorPlaceholders =
	function _ConnectorPlaceholders(
		{
			parentId, placeholdersInfo, leftPortCount, rightPortCount,
			localClientId, parentX, parentY, parentWidth, parentHeight,
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

		return (
			<div
				className="connection"
				style={{color: 'white'}}
			>
				{new Array(leftPortCount).fill(0).map((_, port) => {
					const y = calculateConnectorPositionY(parentY, parentHeight, leftPortCount, port)
					return (
						<div key={'left-' + port}>
							<ConnectorPlaceholder
								onMouseDown={onMouseDown(y, port)}
								x={parentX + (leftConnections.filter(x => x.targetPort === port).count() * -connectorWidth) - connectorWidth}
								y={y}
								sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Source}
							/>
						</div>
					)
				})}
				{new Array(rightPortCount).fill(0).map((_, port) => {
					const y = calculateConnectorPositionY(parentY, parentHeight, rightPortCount, port)
					return (
						<div key={'right-' + port}>
							<ConnectorPlaceholder
								onMouseDown={onMouseDown(y, port)}
								x={parentX + parentWidth + (rightConnections.filter(x => x.sourcePort === port).count() * connectorWidth)}
								y={y}
								sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Target}
							/>
						</div>
					)
				})}
			</div>
		)
	}

const makeMapStateToProps = () => {
	const selectPlaceholdersInfo = createSelectPlaceholdersInfo()
	const mapStateToProps = (state: IClientAppState, props: Props): ReduxProps => {
		const parentPosition = selectPosition(state.room, props.parentId)
		return {
			placeholdersInfo: selectPlaceholdersInfo(state.room, props.parentId),
			localClientId: selectLocalClientId(state),
			parentX: parentPosition.x,
			parentY: parentPosition.y,
			parentWidth: parentPosition.width,
			parentHeight: parentPosition.height,
			leftPortCount: parentPosition.inputPortCount,
			rightPortCount: parentPosition.outputPortCount,
		}
	}
	return mapStateToProps
}

export const ConnectedConnectorPlaceholders = shamuConnect(
	makeMapStateToProps,
)(ConnectorPlaceholders)
