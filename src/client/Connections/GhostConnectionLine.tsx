import React from 'react'
import {longLineStrokeWidth} from './ConnectionView'

interface GhostConnectionLineProps {
	color: string
	pathDPart1: string
}

export const GhostConnectionLine = React.memo(
	function _GhostConnectionLine({
		color, pathDPart1,
	}: GhostConnectionLineProps) {
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
				<g>
					<path
						className="mainLongLine"
						d={pathDPart1}
						stroke={color}
						strokeWidth={longLineStrokeWidth + 'px'}
						strokeDasharray={'8 4'}
						strokeLinecap="round"
					>
					</path>
				</g>
			</svg>
		)
	},
)
