import React from 'react'
import {useDispatch} from 'react-redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {betterSequencerActions} from '@corgifm/common/redux'

interface Props {
	id: Id
	event: MidiClipEvent
	noteHeight: number
	columnWidth: number
	isSelected: boolean
	// TODO Don't need this, use transform translate on parent
	panPixels: Point
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
}

export const BetterNote = React.memo(({
	id, event, noteHeight, columnWidth, panPixels, isSelected, onNoteSelect,
}: Props) => {

	const dispatch = useDispatch()
	const noteLabel = midiNoteToNoteNameFull(event.note)

	return (
		<div
			key={event.id.toString()}
			// Class must start with `note`
			className={`note selected-${isSelected}`}
			title={noteLabel}
			onMouseDown={e => {
				if (e.button !== 0) return
				e.stopPropagation()
				if (e.shiftKey) {
					onNoteSelect(event.id, !isSelected, false)
				} else {
					onNoteSelect(event.id, true, true)
				}
			}}
			onDoubleClick={e => {
				e.preventDefault()
				e.stopPropagation()
				dispatch(betterSequencerActions.deleteEvents(id, [event.id]))
			}}
			style={{
				width: event.durationBeats * columnWidth,
				height: noteHeight - 1,
				left: event.startBeat * columnWidth - panPixels.x,
				top: ((128 - event.note) * noteHeight) - noteHeight - panPixels.y,
			}}
		>
			<div
				className="noteLabel"
				style={{
					fontSize: 14,
					display: noteHeight <= 15 ? 'none' : undefined,
				}}
			>
				{noteLabel}
			</div>
		</div>
	)
})
