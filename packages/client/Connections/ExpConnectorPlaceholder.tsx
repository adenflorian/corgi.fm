import React, {useState, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {hot} from 'react-hot-loader'
import {
	ActiveGhostConnectorSourceOrTarget, localActions,
	expGhostConnectorActions, ExpGhostConnection,
	IClientAppState, selectLocalClientId,
	GhostConnectorAddingOrMoving,
} from '@corgifm/common/redux'
import {ExpPortReact} from '../Experimental/ExpPorts'
import {useObjectChangedEvent, useNumberChangedEvent} from '../Experimental/hooks/useCorgiEvent'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	sourceOrTarget: ActiveGhostConnectorSourceOrTarget
	parentX: number
	parentY: number
	parentWidth: number
	nodeId: Id
	port: ExpPortReact
}

export const ExpConnectorPlaceholder = hot(module)(React.memo(
	function _ExpConnectorPlaceholder({
		sourceOrTarget, parentX, parentY, nodeId, port, parentWidth,
	}: Props) {

		const portPosition = useObjectChangedEvent(port.onPositionChanged)
		const portConnectionCount = useNumberChangedEvent(port.onConnectionCountChanged)

		const x = sourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? parentX + portPosition.x + (portConnectionCount * -connectorWidth) - connectorWidth
			: parentX + parentWidth - portPosition.x + (portConnectionCount * connectorWidth)
		const y = parentY + portPosition.y

		const [isMouseOver, setIsMouseOver] = useState(false)

		const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

		const dispatch = useDispatch()

		const onMouseUp = useCallback(() => {
			dispatch(localActions.mouseUpOnExpPlaceholder(nodeId, sourceOrTarget, port.id))
		}, [dispatch, nodeId, port.id, sourceOrTarget])

		const onMouseDown = useCallback((e: React.MouseEvent) => {
			if (e.button !== 0) return
			dispatch(expGhostConnectorActions.create(new ExpGhostConnection(
				{x, y},
				{parentNodeId: nodeId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Adding,
				port.id,
				port.id,
				port.type,
			)))
		}, [dispatch, localClientId, nodeId, port.id, port.type, sourceOrTarget, x, y])

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
