import * as React from 'react'
import {connect} from 'react-redux'
import {selectClientPointerInfo} from '../../common/redux'
import {IClientAppState} from '../../common/redux'
import {CssColor} from '../../common/shamu-color'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

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
	React.memo(({color, name, x, y}) =>
		<div
			className="pointer"
			style={{
				position: 'fixed',
				top: y - 2,
				left: x - 8,
				width: 16,
				height: 16,
				zIndex: 10,
				pointerEvents: 'none',
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
				style={{
					color,
					marginLeft: 14,
				}}
			>
				{name}
			</div>
		</div>,
	)

export const ConnectedMousePointer = connect(
	(state: IClientAppState, props: MousePointerProps): MousePointerReduxProps => {
		const {x, y, mainBoardsRectX, mainBoardsRectY, size, ...rest} = selectClientPointerInfo(state, props.clientId)

		return {
			...rest,
			x: (x * simpleGlobalClientState.zoom) + mainBoardsRectX - (size / 2),
			y: (y * simpleGlobalClientState.zoom) + mainBoardsRectY - (size / 2),
		}
	},
)(MousePointer)
