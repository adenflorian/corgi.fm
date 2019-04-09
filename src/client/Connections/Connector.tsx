import * as React from 'react'
import {CssColor} from '../../common/shamu-color'

interface ConnectorProps {
	width: number
	height: number
	saturate: boolean
	x?: number
	y?: number
	svgProps?: React.SVGProps<SVGSVGElement>
	showAddSymbol?: boolean
}

export const Connector: React.FC<ConnectorProps> =
	React.memo(function _Connector({
		width, height, saturate = false, x = 0, y = 0, svgProps = {},
		showAddSymbol,
	}) {
		return (
			<svg
				{...svgProps}
				className={`colorize connector ${saturate ? 'saturate' : ''} ${svgProps.className}`}
				xmlns="http://www.w3.org/2000/svg"
				style={{
					width,
					height,
					top: y - (height / 2),
					left: x,
					opacity: showAddSymbol
						? 0.5
						: 1,
				}}
			>
				<line
					x1={0}
					y1={height / 2}
					x2={width}
					y2={height / 2}
					strokeWidth={height}
				/>
				{/* {showAddSymbol &&
					<React.Fragment>
						<g
							stroke={CssColor.knobGray}
							strokeWidth={2}
							className="addConnectionPlusSymbol"
						>
							<line
								x1={4}
								y1={height / 2}
								x2={12}
								y2={height / 2}
							/>
							<line
								x1={width / 2}
								y1={0}
								x2={width / 2}
								y2={8}
							/>
						</g>
					</React.Fragment>
				} */}
			</svg>
		)
	})
