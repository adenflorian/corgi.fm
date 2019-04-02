import React from 'react'

interface Props {
	position: {
		x: number,
		y: number,
	}
}

export const ContextMenu =
	function _ContextMenu({position: {x, y}}: Props) {
		return (
			<div
				className="contextMenu"
				style={{
					transform: `translate(${x}px, ${y}px)`,
				}}
			>
				<div
					className="contextMenuTop"
					title="shift + right click to get browser context menu"
				>
					do stuff
				</div>
				<div
					className="contextMenuOption"
				>
					Add Synth
				</div>
				<div
					className="contextMenuOption"
				>
					Add Grid Sequencer
				</div>
			</div>
		)
	}
