import React from 'react'
import {Map} from 'immutable'
import {MidiClip} from '@corgifm/common/midi-types'
import {BetterNote} from './BetterNote'

interface Props {
	id: Id
	noteHeight: number
	columnWidth: number
	panPixels: Point
	midiClip: MidiClip
	selected: Map<Id, boolean>
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	clearSelected: () => void
}

export const BetterNotes = (props: Props) => {
	const {
		id, panPixels, noteHeight, columnWidth, selected, onNoteSelect,
		clearSelected,
	} = props

	return (
		<div
			className="notes"
		>
			<div
				className="scalable"
				style={{
					transform: `translate(${-panPixels.x}px, ${-panPixels.y}px)`,
				}}
				onMouseDown={e => {
					if (e.button !== 0 || e.shiftKey) return
					clearSelected()
				}}
			>
				{props.midiClip.events.map(event => {
					const isSelected = selected.get(event.id) || false
					return (
						<BetterNote
							key={event.id.toString()}
							{...{
								id,
								event,
								noteHeight,
								columnWidth,
								isSelected,
								panPixels,
								onNoteSelect,
							}}
						/>
					)
				}).toList()}
			</div>
		</div>
	)
}
