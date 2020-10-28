import React, {Fragment} from 'react'
import {tinyNoteHeight} from '@corgifm/common/BetterConstants'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	noteHeight: number
	rows: string[]
}

export const BetterRows = React.memo(function _BetterRows({
	noteHeight, rows,
}: Props) {
	return (
		<div className="rows">
			<div
				className="scalable"
			>
				<BetterRowsArray
					noteHeight={noteHeight}
					rows={rows}
				/>
			</div>
		</div>
	)
})

interface BetterRowsArrayProps {
	noteHeight: number
	rows: string[]
}

export const BetterRowsArray = React.memo(function _BetterRowsArray({
	noteHeight, rows,
}: BetterRowsArrayProps) {
	const tiny = noteHeight <= tinyNoteHeight

	return (
		<Fragment>
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
		</Fragment>
	)
})
