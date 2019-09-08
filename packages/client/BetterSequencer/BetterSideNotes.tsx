import React, {useCallback, Fragment, useState} from 'react'
import {Set} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {betterSideNotesWidth, smallNoteHeight} from '@corgifm/common/BetterConstants'
import {useDispatch, useSelector} from 'react-redux'
import {localActions, createAnimationFrameSelector, createAnimationFlagSelector, IClientAppState, selectOptions, animationActions} from '@corgifm/common/redux'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	id: Id
	rows: string[]
	panPixelsY: number
	noteHeight: number
}

export const BetterSideNotes = React.memo(function _BetterSideNotes({
	id, rows, panPixelsY, noteHeight,
}: Props) {
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
				<BetterSideNotesArray
					id={id}
					rows={rows}
					noteHeight={noteHeight}
				/>
			</div>
		</div>
	)
})

interface BetterSideNotesArrayProps {
	id: Id
	rows: string[]
	noteHeight: number
}

export const BetterSideNotesArray = React.memo(function _BetterSideNotesArray({
	id, rows, noteHeight,
}: BetterSideNotesArrayProps) {
	return (
		<Fragment>
			{rows.map((row, i) =>
				<BetterSideNote
					id={id}
					i={i}
					key={row}
					row={row}
					noteHeight={noteHeight}
				/>
			)}
		</Fragment>
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
	const fancy = useSelector((state: IClientAppState) => selectOptions(state).graphicsExtraAnimations)
	const onClick = useCallback(() => {
		dispatch(localActions.playShortNote(id, Set([i])))
		if (fancy) dispatch(animationActions.on(Set([id]), i))
		setTimeout(() => {
			if (fancy) dispatch(animationActions.off(Set([id]), i))
		}, 250)
	}, [dispatch, fancy, i, id])

	const flag = useSelector(createAnimationFlagSelector(id, i))

	const animClass = flag
		? 'animate-on'
		: 'animate-off'

	return (
		<div
			key={row}
			className={`row ${animClass} ${isWhite ? 'white' : 'black'}`}
			style={{
				height: noteHeight - 1,
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
