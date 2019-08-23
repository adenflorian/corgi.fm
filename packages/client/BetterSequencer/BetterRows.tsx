import React from 'react'
import {tinyNoteHeight} from '@corgifm/common/BetterConstants'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	panPixelsY: number
	noteHeight: number
	rows: string[]
}

export const BetterRows = React.memo(({
	panPixelsY, noteHeight, rows,
}: Props) => {
	const tiny = noteHeight <= tinyNoteHeight

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
								border: tiny ? 'none' : undefined,
							}}
						/>
					)
				})}
			</div>
		</div>
	)
})
