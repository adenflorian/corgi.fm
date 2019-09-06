import React, {useCallback} from 'react'
import {Set} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {betterSideNotesWidth, smallNoteHeight} from '@corgifm/common/BetterConstants'
import {useDispatch} from 'react-redux'
import {localActions} from '@corgifm/common/redux'
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
				{rows.map((row, i) =>
					<BetterSideNote
						id={id}
						i={i}
						key={row}
						row={row}
						noteHeight={noteHeight}
					/>
				)}
			</div>
		</div>
	)
})

interface BetterSideNoteProps {
	id: Id
	i: number
	row: string
	noteHeight: number
}

export const BetterSideNote = React.memo(({
	id, i, row, noteHeight,
}: BetterSideNoteProps) => {
	const isWhite = isWhiteKey(i)
	const isC = i % 12 === 0
	const isSmall = noteHeight <= smallNoteHeight
	const dispatch = useDispatch()
	const onClick = useCallback(() => {
		dispatch(localActions.playShortNote(id, Set([i])))
	}, [dispatch, i, id])
	return (
		<div
			key={row}
			className="row"
			style={{
				height: noteHeight - 1,
				backgroundColor: isWhite
					? CssColor.defaultGray
					: CssColor.panelGrayDark,
				fontWeight: isWhite ? 600 : 400,
			}}
			onMouseDown={onClick}
		>
			<div
				className="rowLabel"
				style={{
					opacity: isSmall ? 0 : isC ? 1 : undefined,
					color: isWhite ? CssColor.panelGrayDark : CssColor.defaultGray,
				}}
			>
				{row}
			</div>
		</div>
	)
})
