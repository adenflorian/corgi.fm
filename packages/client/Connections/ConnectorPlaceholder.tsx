import React, {Fragment, useState} from 'react'
import {
	ActiveGhostConnectorSourceOrTarget,
} from '@corgifm/common/redux'
import {connectorHeight, connectorWidth} from './ConnectionView'
import {Connector} from './Connector'

interface Props {
	onMouseDown: any
	sourceOrTarget: ActiveGhostConnectorSourceOrTarget
	x: number
	y: number
}

type AllProps = Props

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
			</Fragment>
		)
	},
)
