import React, {useRef, useLayoutEffect, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {betterSequencerActions} from '@corgifm/common/redux'
import {BetterNoteResizer} from './BetterNoteResizer'

interface Props {
	id: Id
	event: MidiClipEvent
	noteHeight: number
	columnWidth: number
	isSelected: boolean
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	handleMouseDown: (direction: 'left' | 'right', eventId: Id) => void
}

export const BetterNote = React.memo(({
	id, event, noteHeight, columnWidth, isSelected, onNoteSelect, handleMouseDown,
}: Props) => {

	const dispatch = useDispatch()
	const noteLabel = midiNoteToNoteNameFull(event.note)

	const mainRef = useRef<HTMLDivElement>(null)

	const selectNote = useCallback(() => {
		onNoteSelect(event.id, true, false)
	}, [onNoteSelect, event.id])

	useLayoutEffect(() => {

		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return
			e.stopPropagation()
			if (e.shiftKey) {
				onNoteSelect(event.id, !isSelected, false)
			} else {
				onNoteSelect(event.id, true, true)
			}
		}

		const onDoubleClick = (e: MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			dispatch(betterSequencerActions.deleteEvents(id, [event.id]))
		}

		const noteElement = mainRef.current

		if (noteElement === null) return

		noteElement.addEventListener('dblclick', onDoubleClick)
		noteElement.addEventListener('mousedown', onMouseDown)

		return () => {
			noteElement.removeEventListener('dblclick', onDoubleClick)
			noteElement.removeEventListener('mousedown', onMouseDown)
		}
	}, [onNoteSelect, event.id, isSelected, id])

	return (
		<div
			key={event.id.toString()}
			// Class must start with `note `
			className={`note selected-${isSelected}`}
			title={noteLabel}
			style={{
				width: event.durationBeats * columnWidth,
				height: noteHeight - 1,
				left: event.startBeat * columnWidth,
				top: ((128 - event.note) * noteHeight) - noteHeight,
			}}
			ref={mainRef}
		>
			<div
				className="noteLabel"
				style={{
					display: noteHeight <= 27 ? 'none' : undefined,
				}}
			>
				{noteLabel}
			</div>
			<BetterNoteResizer {...{id, handleMouseDown, selectNote, eventId: event.id}} />
		</div>
	)
})
