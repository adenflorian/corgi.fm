import React, {Fragment} from 'react'
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

export const ConnectorPlaceholder = React.memo(
	function _ConnectorPlaceholder({
		sourceOrTarget, x, y, onMouseDown,
	}: AllProps) {
		return (
			<Fragment>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					saturate={false}
					x={x}
					y={y}
					isPlaceHolderForNewConnection={true}
					svgProps={{
						className: 'newConnectionPlaceholder',
						onMouseDown: e => e.button === 0 && onMouseDown(
							x,
							sourceOrTarget,
						),
					}}
				/>
				{/* <div
					className="newConnectionPlaceholder-hitbox"
				/> */}
			</Fragment>
		)
	},
)
