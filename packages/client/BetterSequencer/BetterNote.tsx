import React, {useRef, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {betterSequencerActions} from '@corgifm/common/redux'
import {smallNoteHeight, tinyNoteHeight} from '@corgifm/common/BetterConstants'
import {BetterNoteResizer} from './BetterNoteResizer'

interface Props {
	id: Id
	event: MidiClipEvent
	noteHeight: number
	columnWidth: number
	isSelected: boolean
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => void
}

export const BetterNote = React.memo(({
	id, event, noteHeight, columnWidth, isSelected, onNoteSelect, handleMouseDown,
}: Props) => {

	const dispatch = useDispatch()
	const noteLabel = midiNoteToNoteNameFull(event.note)

	const mainRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {

		// TODO I don't think this ever gets called
		// It gets intercepted by the resizer
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
	}, [onNoteSelect, event.id, isSelected, id, dispatch])

	const tiny = noteHeight <= tinyNoteHeight
	const small = noteHeight <= smallNoteHeight

	return (
		<div
			key={event.id.toString()}
			className={`note selected-${isSelected}`}
			title={noteLabel}
			style={{
				width: event.durationBeats * columnWidth,
				height: noteHeight - (tiny ? 0 : 2),
				left: event.startBeat * columnWidth,
				top: ((128 - event.note) * noteHeight) - noteHeight + (tiny ? 0 : 1),
				border: tiny && !isSelected ? 'none' : undefined,
				borderRadius: tiny ? 0 : undefined,
			}}
			ref={mainRef}
		>
			<div
				className="noteLabel"
				style={{
					display: small ? 'none' : undefined,
				}}
			>
				{noteLabel}
			</div>
			<BetterNoteResizer {...{id, handleMouseDown, eventId: event.id}} />
		</div>
	)
})
