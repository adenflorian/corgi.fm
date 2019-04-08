import * as React from 'react'

interface ConnectorProps {
	width: number
	height: number
	saturate: boolean
	x?: number
	y?: number
	svgProps?: React.SVGProps<SVGSVGElement>
}

export const Connector: React.FC<ConnectorProps> =
	React.memo(function _Connector({
		width, height, saturate = false, x = 0, y = 0, svgProps = {},
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
				}}
			>
				<line
					x1={0}
					y1={height / 2}
					x2={width}
					y2={height / 2}
					strokeWidth={height}
				/>
			</svg>
		)
	})
