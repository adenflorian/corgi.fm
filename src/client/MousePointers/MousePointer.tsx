import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState, selectClientById, selectPointer} from '../../common/redux'
import {CssColor} from '../../common/shamu-color'

interface MousePointerProps {
	clientId: string
}

interface MousePointerReduxProps {
	color: string,
	name: string,
	x: number,
	y: number,
}

type MousePointerAllProps = MousePointerProps & MousePointerReduxProps

export const MousePointer: React.FC<MousePointerAllProps> =
	React.memo(function _MasterControls({color, name, x, y}) {
		return (
			<div
				className="pointer"
				style={{
					position: 'absolute',
					width: 0,
					height: 0,
					zIndex: 2147483647,
					pointerEvents: 'none',
					transform: `translate(${x - 16}px, ${y - 8}px)`,
					willChange: 'transform',
					transition: 'transform 0.1s',
				}}
			>
				<svg
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMidYMid meet"
					viewBox="0 0 64 64"
					width="48px"
					height="48px"
				>
					<path
						d="
						M46 38.56L34.78 37.77L40.36 51.15L35.49 53L30.07 39.23L22.17 47.18L22 12.37L46 38.56Z
						"
						opacity="1"
						fill={CssColor.panelGray}
						stroke={color}
						strokeWidth="2"
						strokeOpacity="1"
					/>
				</svg>
				<div
					className="pointerName"
					style={{
						color,
						marginLeft: 14,
						whiteSpace: 'nowrap',
					}}
				>
					{name}
				</div>
			</div>
		)
	})

export const ConnectedMousePointer = connect(
	(state: IClientAppState, props: MousePointerProps): MousePointerReduxProps => {
		const client = selectClientById(state, props.clientId)
		const pointer = selectPointer(state.room, props.clientId)

		return {
			color: client.color,
			name: client.name,
			x: pointer.x,
			y: pointer.y,
		}
	},
)(MousePointer)
