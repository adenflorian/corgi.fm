import * as React from 'react'
import {CssColor} from '../../common/shamu-color'

interface ConnectorProps {
	width: number
	height: number
	saturate: boolean
	x?: number
	y?: number
	svgProps?: React.SVGProps<SVGSVGElement>
	isPlaceHolderForNewConnection?: boolean
	title?: string
}

export const Connector: React.FC<ConnectorProps> =
	React.memo(function _Connector({
		width, height, saturate = false, x = 0, y = 0, svgProps = {},
		isPlaceHolderForNewConnection, title,
	}) {
		return (
			<React.Fragment>
				<svg
					{...svgProps}
					className={`colorize connector ${saturate ? 'saturate' : ''} ${svgProps.className}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width,
						height,
						top: y - (height / 2),
						left: x,
						opacity: isPlaceHolderForNewConnection
							? 0.5
							: 1,
						...svgProps.style,
					}}
				>
					{title && <title>{title}</title>}
					<line
						x1={0}
						y1={height / 2}
						x2={width}
						y2={height / 2}
						strokeWidth={height}
						strokeLinecap="round"
					/>
					{isPlaceHolderForNewConnection &&
						<g
							stroke={CssColor.subtleGrayBlackBg}
							strokeWidth={2}
							className="addConnectionPlusSymbol"
							strokeLinecap="round"
						>
							<line
								x1={5}
								y1={height / 2}
								x2={11}
								y2={height / 2}
							/>
							<line
								x1={width / 2}
								y1={1}
								x2={width / 2}
								y2={7}
							/>
						</g>
					}
				</svg>
			</React.Fragment>
		)
	})
