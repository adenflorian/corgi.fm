import React, {useState, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget, localActions,
} from '@corgifm/common/redux'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	onMouseDown: any
	sourceOrTarget: ActiveGhostConnectorSourceOrTarget
	x: number
	y: number
	nodeId: Id
	portId: number
}

type AllProps = Props

export const ConnectorPlaceholder = React.memo(
	function _ConnectorPlaceholder({
		sourceOrTarget, x, y, onMouseDown, nodeId, portId,
	}: AllProps) {

		const [isMouseOver, setIsMouseOver] = useState(false)

		const dispatch = useDispatch()

		const onMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
			dispatch(localActions.mouseUpOnPlaceholder(nodeId, sourceOrTarget, portId))
		}, [dispatch, nodeId, portId, sourceOrTarget])

		return (
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
						onMouseDown: e => {
							if (e.button === 0) onMouseDown(x, sourceOrTarget)
						},
					}}
				/>
				<div
					className="newConnectionPlaceholder-hitbox"
					style={{
						transform: `translate(${x}px, ${y}px)`,
					}}
					onMouseEnter={() => setIsMouseOver(true)}
					onMouseLeave={() => setIsMouseOver(false)}
				/>
			</div>
		)
	},
)
