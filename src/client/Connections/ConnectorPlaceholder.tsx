import React, {Fragment, useState} from 'react'
import {
	ActiveGhostConnectorSourceOrTarget,
} from '../../common/redux'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	onMouseDown: any
	sourceOrTarget: ActiveGhostConnectorSourceOrTarget
	x: number
	y: number
}

type AllProps = Props

const hitBoxSize = 80

export const ConnectorPlaceholder = React.memo(
	function _ConnectorPlaceholder({
		sourceOrTarget, x, y, onMouseDown,
	}: AllProps) {

		const [isMouseOver, setIsMouseOver] = useState(false)

		return (
			<Fragment>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					saturate={false}
					x={x}
					y={y}
					isPlaceHolderForNewConnection={true}
					title="click and drag to make a new connection"
					svgProps={{
						className: `newConnectionPlaceholder ${isMouseOver ? 'newConnectionPlaceholder-visible' : ''}`,
						onMouseDown: e => e.button === 0 && onMouseDown(
							x,
							sourceOrTarget,
						),
					}}
				/>
				<div
					className="newConnectionPlaceholder-hitbox"
					style={{
						width: 80,
						height: 80,
						backgroundColor: 'magenta',
						position: 'absolute',
						transform: `translate(${x - (hitBoxSize / 2)}px, ${y - (hitBoxSize / 2)}px)`,
						opacity: 0,
						zIndex: -10,
					}}
					onMouseEnter={() => setIsMouseOver(true)}
					onMouseLeave={() => setIsMouseOver(false)}
				/>
			</Fragment>
		)
	},
)
