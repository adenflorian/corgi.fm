import React from 'react'

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
				className="colorize longLine"
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
						className="mainLongLine mainLongLine-ghost"
						d={pathDPart1}
						stroke={color}
					/>
				</g>
			</svg>
		)
	},
)
