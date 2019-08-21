import React from 'react'
import {isWhiteKey} from '../Keyboard/Keyboard'

const rows = new Array(128).fill(0)

interface Props {
	panPixelsY: number
	noteHeight: number
}

export const BetterRows = React.memo(({panPixelsY, noteHeight}: Props) => {
	return (
		<div className="rows">
			<div
				className="scalable"
				style={{
					transform: `translateY(${-panPixelsY}px)`,
				}}
			>
				{rows.map((_, note) => {
					return (
						<div
							key={note}
							className={`row note-${note}`}
							style={{
								backgroundColor: isWhiteKey(note) ? '#4444' : '#0000',
								height: noteHeight,
							}}
						/>
					)
				})}
			</div>
		</div>
	)
})
