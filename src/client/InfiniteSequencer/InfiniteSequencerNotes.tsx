import {stripIndents} from 'common-tags'
import React, {useLayoutEffect, useState} from 'react'
import {Dispatch} from 'redux'
import {MidiClipEvents} from '../../common/midi-types'
import {IMidiNote} from '../../common/MidiNote'
import {
	findLowestAndHighestNotes, infiniteSequencerActions,
	InfiniteSequencerStyle, selectInfiniteSequencer, shamuConnect,
} from '../../common/redux'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../WebAudio'

interface Props {
	id: string
}

interface ReduxProps {
	events: MidiClipEvents
	showRows: boolean
	style: InfiniteSequencerStyle
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

const sensitivity = 0.1
const threshold = 1

export function InfiniteSequencerNotes({id, style, events, showRows, dispatch}: AllProps) {

	const [selectedEvent, setSelectedEvent] = useState({
		isSelected: false,
		index: -1,
	})

	const [mouseDelta, setMouseDelta] = useState({x: 0, y: 0})

	const {lowestNote, highestNote} = findLowestAndHighestNotes(events)
	const numberOfPossibleNotes = highestNote - lowestNote + 1
	const noteHeightPercentage = 100 / numberOfPossibleNotes
	const rows = [] as any[]

	if (events.count() > 0) {
		for (let i = highestNote; i >= lowestNote; i--) {
			rows.push(i)
		}
	}

	useLayoutEffect(() => {
		if (selectedEvent.isSelected) {
			window.addEventListener('mousemove', handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
		}
	}, [selectedEvent, mouseDelta, events])

	const handleMouseDown = (event: React.MouseEvent, note: IMidiNote, index: number) => {
		if (event.button === 0) {
			if (event.shiftKey) {
				event.preventDefault()
				dispatch(infiniteSequencerActions.deleteNote(id, index))
			} else {
				if (note < 0) return

				setSelectedEvent({
					isSelected: true,
					index,
				})
			}
		}
	}

	const handleMouseMove = (event: MouseEvent) => {
		if (!selectedEvent.isSelected) return

		if (event.buttons !== 1) return setSelectedEvent({isSelected: false, index: -1})

		const newMouseDelta = {
			x: mouseDelta.x + event.movementX,
			y: mouseDelta.y - event.movementY,
		}

		const delta = newMouseDelta.y * sensitivity

		if (Math.abs(delta) > threshold) {
			const index = selectedEvent.index
			const oldNote = events.get(index)!.notes.first(-1)

			const newNote = oldNote + (delta > 0 ? 1 : -1)
			dispatch(infiniteSequencerActions.setNote(id, selectedEvent.index, true, newNote))
			setMouseDelta({x: 0, y: 0})
		} else {
			setMouseDelta(newMouseDelta)
		}

	}

	if (style === InfiniteSequencerStyle.colorBars) {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.map((event, index) => {
						const note = event.notes.first(-1)

						return (
							< div
								key={index}
								className={`event largeFont`}
								style={{
									backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
									borderRadius: 4,
								}}
							>
								{note === -1
									? undefined
									: events.count() <= 8
										? midiNoteToNoteName(note) + getOctaveFromMidiNote(note)
										: undefined
								}
							</div>
						)
					},
					)}
				</div>
			</div>
		)
	} else {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.map(x => x.notes.first(-1)).map((note, index) =>
						<ColorGridNote
							note={note}
							index={index}
							key={index}
							height={noteHeightPercentage + (note === lowestNote ? 1 : 0)}
							top={(highestNote - note) * noteHeightPercentage}
							onMouseDown={handleMouseDown}
						/>,
					)}
				</div>
				{showRows &&
					<div className="rows">
						{rows.map(note => (
							<div
								key={note}
								className={`row ${isWhiteKey(note) ? 'white' : 'black'}`}
								style={{
									height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
									top: `${(highestNote - note) * noteHeightPercentage}%`,
									width: '100%',
								}}
							/>
						))}
					</div>
				}
			</div>
		)
	}
}

type HandleMouseDown = (event: React.MouseEvent, note: IMidiNote, index: number) => void

const ColorGridNote = React.memo(
	function _ColorGridNote({note, index, height, top, onMouseDown}: {note: IMidiNote, index: number, height: number, top: number, onMouseDown: HandleMouseDown}) {
		return (
			<div
				className={`event noDrag`}
				onMouseDown={e => onMouseDown(e, note, index)}
				title={stripIndents`drag up and down with left mouse
					shift + left click to delete`}
			>
				<div
					className={`note`}
					style={{
						backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
						height: `${height}%`,
						top: `${top}%`,
					}}
				/>
			</div>
		)
	},
)

export const ConnectedInfiniteSequencerNotes = shamuConnect(
	(state, props: Props): ReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			events: infiniteSequencerState.midiClip.events,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencerNotes)
