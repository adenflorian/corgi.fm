import {List} from 'immutable'
import React from 'react'
import {Dispatch} from 'redux'
import {connectionsActions} from '../../common/redux'
import {saturateColor} from '../../common/shamu-color'
import {longLineTooltip} from '../client-constants'
import {longLineStrokeWidth} from './ConnectionView'
import {LineState} from './LineState'

interface ConnectionLineProps {
	id: string
	color: string
	saturateSource: boolean
	saturateTarget: boolean
	dispatch: Dispatch
	pathDPart1: string
	pathDFull: string
	connectedLine: LineState
	speed?: number
	isSourcePlaying: boolean
	highQuality: boolean
}

export const ConnectionLine = React.memo(
	function _ConnectionLine({id, color, saturateSource, saturateTarget, pathDPart1,
		pathDFull, dispatch, connectedLine, speed = 1,
		isSourcePlaying, highQuality}: ConnectionLineProps,
	) {
		const saturatedColor = saturateColor(color)

		return (
			<svg
				className={`colorize longLine`}
				xmlns="http://www.w3.org/2000/svg"
				style={{
					position: 'fixed',
					pointerEvents: 'none',
					color,
					fill: 'none',
				}}
			>
				<defs>
					{highQuality &&
						<linearGradient
							id={id}
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
						<feColorMatrix in="SourceGraphic"
							type="saturate"
							values="3" />
					</filter>
				</defs>
				<g
					onContextMenu={(e: React.MouseEvent) => {
						if (e.shiftKey) return
						dispatch(connectionsActions.delete(List([id])))
						e.preventDefault()
					}}
				>
					<path
						className="mainLongLine"
						d={pathDPart1}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
						strokeWidth={longLineStrokeWidth + 'px'}
					>
					</path>
					<path
						className="invisibleLongLine"
						d={pathDPart1}
						stroke="#0000"
						strokeWidth={24 + 'px'}
					>
						<title>{longLineTooltip}</title>
					</path>
					<path
						className="blurLine"
						d={pathDFull}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
						strokeWidth={4 + 'px'}
					>
						<title>{longLineTooltip}</title>
					</path>
					{highQuality && isSourcePlaying &&
						<path
							style={{
								animationDuration: (3600 / speed) + 's',
							}}
							className="animatedLongLine"
							d={pathDPart1}
							stroke={saturatedColor}
							strokeWidth={longLineStrokeWidth * 2 + 'px'}
							strokeDasharray="4 8"
						/>
					}
				</g>
			</svg>
		)
	},
)
