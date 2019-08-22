import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {betterSideNotesWidth, smallNoteHeight} from '@corgifm/common/BetterConstants'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	id: Id
	rows: string[]
	panPixelsY: number
	noteHeight: number
}

export const BetterSideNotes = React.memo(({
	id, rows, panPixelsY, noteHeight,
}: Props) => {
	return (
		<div
			className="sideNotes"
			style={{
				width: betterSideNotesWidth,
			}}
		>
			<div
				className="transformable"
				style={{
					transform: `translateY(${-panPixelsY}px)`,
				}}
			>
				{rows.map((row, i) => {
					const isWhite = isWhiteKey(i)
					const isC = i % 12 === 0
					const isSmall = noteHeight <= smallNoteHeight
					return (
						<div
							key={row}
							className="row"
							style={{
								height: noteHeight - 1,
								backgroundColor: isWhite
									? CssColor.defaultGray
									: CssColor.panelGrayDark,
								color: isWhite ? CssColor.panelGrayDark : CssColor.defaultGray,
								fontWeight: isWhite ? 600 : 400,
							}}
						>
							<div
								className="rowLabel"
								style={{
									opacity: isSmall ? 0 : isC ? 1 : undefined,
								}}
							>
								{row}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
})
