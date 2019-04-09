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
}

export const Connector: React.FC<ConnectorProps> =
	React.memo(function _Connector({
		width, height, saturate = false, x = 0, y = 0, svgProps = {},
		isPlaceHolderForNewConnection,
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
						// zIndex: isPlaceHolderForNewConnection
						// 	? -10
						// 	: 0,
					}}
				>
					<line
						x1={0}
						y1={height / 2}
						x2={width}
						y2={height / 2}
						strokeWidth={height}
					/>
					{/* {isPlaceHolderForNewConnection &&
						<line
							className="placeHolderConnectorHitBox"
							x1={-(width * 4)}
							y1={(height / 2)}
							x2={width * 4}
							y2={(height / 2)}
							strokeWidth={height * 8}
							stroke="magenta"
						/>
					} */}
				</svg>
				{/* {isPlaceHolderForNewConnection &&
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
							// zIndex: isPlaceHolderForNewConnection
							// 	? -10
							// 	: 0,
						}}
					>
						{isPlaceHolderForNewConnection &&
							<line
								className="placeHolderConnectorHitBox"
								x1={-(width * 4)}
								y1={(height / 2)}
								x2={width * 4}
								y2={(height / 2)}
								strokeWidth={height * 8}
								stroke="magenta"
							/>
						}
					</svg>
				} */}
			</React.Fragment>
		)
	})
