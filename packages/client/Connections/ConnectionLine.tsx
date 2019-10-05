import React from 'react'
import {saturateColor} from '@corgifm/common/shamu-color'
import {longLineTooltip} from '../client-constants'
import {LineState} from './LineState'

interface ConnectionLineProps {
	id: Id
	color: string
	saturateSource: boolean
	saturateTarget: boolean
	pathDPart1: string
	pathDFull: string
	connectedLine: LineState
	speed?: number
	isSourcePlaying: boolean
	highQuality: boolean
	onDelete: () => void
	z?: number
}

export const ConnectionLine = React.memo(
	function _ConnectionLine(
		{
			id, color, saturateSource, saturateTarget, pathDPart1,
			pathDFull, connectedLine, speed = 1, z = undefined,
			isSourcePlaying, highQuality, onDelete,
		}: ConnectionLineProps,
	) {
		const saturatedColor = saturateColor(color)

		return (
			<svg
				className="colorize longLine"
				xmlns="http://www.w3.org/2000/svg"
				style={{
					position: 'fixed',
					pointerEvents: 'none',
					color,
					fill: 'none',
					zIndex: z,
				}}
			>
				<defs>
					{highQuality &&
						<linearGradient
							id={id as string}
							x1={(connectedLine.x1)}
							y1={(connectedLine.y1)}
							x2={(connectedLine.x2)}
							y2={(connectedLine.y2)}
							gradientUnits="userSpaceOnUse"
						// gradientUnits="objectBoundingBox"
						>
							<stop stopColor={(saturateSource || isSourcePlaying) ? saturatedColor : color} offset="0%" />
							<stop stopColor={(saturateTarget || isSourcePlaying) ? saturatedColor : color} offset="100%" />
						</linearGradient>
					}
					<filter id="saturate">
						<feColorMatrix
							in="SourceGraphic"
							type="saturate"
							values="3"
						/>
					</filter>
				</defs>
				<g
					onContextMenu={(e: React.MouseEvent) => {
						if (e.shiftKey) return
						onDelete()
						e.preventDefault()
					}}
				>
					<path
						className="mainLongLine"
						d={pathDPart1}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
					/>
					<path
						className="invisibleLongLine"
						d={pathDPart1}
						stroke="#0000"
						strokeWidth="24px"
					>
						<title>{longLineTooltip}</title>
					</path>
					<path
						className="blurLine"
						d={pathDFull}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
						strokeWidth="4px"
					>
						<title>{longLineTooltip}</title>
					</path>
					{highQuality && isSourcePlaying &&
						<path
							style={{
								animationDuration: `${3600 / speed}s`,
							}}
							className="animatedLongLine"
							d={pathDPart1}
							stroke={saturatedColor}
							strokeDasharray="4 8"
						/>
					}
				</g>
			</svg>
		)
	},
)
