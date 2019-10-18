import React, {useState, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {hot} from 'react-hot-loader'
import {
	ActiveGhostConnectorSourceOrTarget, localActions,
	expGhostConnectorActions, ExpGhostConnection,
	IClientAppState, selectLocalClientId,
	GhostConnectorAddingOrMoving,
} from '@corgifm/common/redux'
import {usePort} from '../Experimental/hooks/usePort'
import {logger} from '../client-logger'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	sourceOrTarget: ActiveGhostConnectorSourceOrTarget
	parentX: number
	parentY: number
	parentWidth: number
	nodeId: Id
	portId: Id
}

type AllProps = Props

export const ExpConnectorPlaceholder = hot(module)(React.memo(
	function _ExpConnectorPlaceholder({
		sourceOrTarget, parentX, parentY, nodeId, portId, parentWidth,
	}: AllProps) {

		const port = usePort(nodeId, portId) || {
			position: {x: 0, y: 0},
			connectionCount: 0,
			type: 'dummy',
		}

		const x = sourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? parentX + port.position.x + (port.connectionCount * -connectorWidth) - connectorWidth
			: parentX + parentWidth - port.position.x + (port.connectionCount * connectorWidth)
		const y = parentY + port.position.y

		const [isMouseOver, setIsMouseOver] = useState(false)

		const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

		const dispatch = useDispatch()

		const onMouseUp = useCallback(() => {
			dispatch(localActions.mouseUpOnExpPlaceholder(nodeId, sourceOrTarget, portId))
		}, [dispatch, nodeId, portId, sourceOrTarget])

		const onMouseDown = useCallback((e: React.MouseEvent) => {
			if (e.button !== 0) return
			dispatch(expGhostConnectorActions.create(new ExpGhostConnection(
				{x, y},
				{parentNodeId: nodeId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Adding,
				portId,
				portId,
				port.type,
			)))
		}, [dispatch, localClientId, nodeId, port.type, portId, sourceOrTarget, x, y])

		// logger.log('ExpConnectorPlaceholder render:', {connectionCount: port.connectionCount, x})

		return (
			<div
				className="connection newConnectionPlaceholderContainer"
				style={{color: 'white'}}
			>
				<div
					className="connectorDropZone"
					onMouseUp={onMouseUp}
				>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
						saturate={false}
						x={x}
						y={y}
						isPlaceHolderForNewConnection={true}
						title="Click and drag to make a new connection"
						svgProps={{
							className: `newConnectionPlaceholder ${isMouseOver ? 'newConnectionPlaceholder-visible' : ''}`,
							onMouseDown,
						}}
					/>
					<div
						className="newConnectionPlaceholder-hitbox"
						style={{
							// marginTop: -(y - (connectorHeight / 2)),
							// marginLeft: x - (connectorWidth / 2),
							transform: `translate(${x}px, ${y}px)`,
						}}
						onMouseEnter={() => setIsMouseOver(true)}
						onMouseLeave={() => setIsMouseOver(false)}
					/>
				</div>
			</div>
		)
	},
))
