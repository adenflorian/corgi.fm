/* eslint-disable react/no-array-index-key */
import {stripIndents} from 'common-tags'
import React, {useLayoutEffect, useState, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {MidiClipEvents} from '@corgifm/common/midi-types'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	infiniteSequencerActions, localActions,
	InfiniteSequencerStyle, selectInfiniteSequencer, shamuConnect,
} from '@corgifm/common/redux'
import {getColorStringForMidiNote} from '@corgifm/common/shamu-color'
import {
	getOctaveFromMidiNote, midiNoteToNoteName,
} from '@corgifm/common/common-samples-stuff'
import {findLowestAndHighestNotes} from '@corgifm/common/common-utils'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	id: Id
}

interface ReduxProps {
	events: MidiClipEvents
	showRows: boolean
	style: InfiniteSequencerStyle
}

type AllProps = Props & ReduxProps

const sensitivity = 0.1
const threshold = 1

export function InfiniteSequencerNotes(
	{id, style, events, showRows}: AllProps
) {
	const dispatch = useDispatch()
	const [selectedEvent, setSelectedEvent] = useState({
		isSelected: false,
		index: -1,
	})
	const [isAreaSelected, setIsAreaSelected] = useState(false)

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
		const handleMouseMove = (event: MouseEvent) => {
			if (isAreaSelected && event.buttons !== 1) setIsAreaSelected(false)

			if (!selectedEvent.isSelected) return

			if (event.buttons !== 1 || !event.shiftKey) return setSelectedEvent({isSelected: false, index: -1})

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
				dispatch(localActions.playShortNote(id, newNote))
				setMouseDelta({x: 0, y: 0})
			} else {
				setMouseDelta(newMouseDelta)
			}
		}

		if (selectedEvent.isSelected || isAreaSelected) {
			window.addEventListener('mousemove', handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
		}
	}, [selectedEvent, mouseDelta, events, isAreaSelected, dispatch, id])

	const handleMouseDown: HandleMouseEvent = useCallback((event: React.MouseEvent, note: IMidiNote, index: number) => {
		if (event.button === 0) {
			setIsAreaSelected(true)

			if (note >= 0) {
				dispatch(localActions.playShortNote(id, note))
			}

			if (event.shiftKey) {
				if (note < 0) return

				setSelectedEvent({
					isSelected: true,
					index,
				})
			}
		} else if (event.button === 2) {
			if (event.shiftKey) {
				event.preventDefault()
				dispatch(infiniteSequencerActions.deleteNote(id, index))
			}
		}
	}, [dispatch, id])

	const handleMouseEnter: HandleMouseEvent = useCallback((event: React.MouseEvent, note: IMidiNote, index: number) => {
		if (event.buttons !== 1 || event.shiftKey || !isAreaSelected) return

		if (note >= 0) {
			dispatch(localActions.playShortNote(id, note))
		}
	}, [dispatch, isAreaSelected, id])

	if (style === InfiniteSequencerStyle.colorBars) {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.map((event, index) => {
						const note = event.notes.first(-1)

						return (
							<div
								key={index}
								className="event usernameFont colorBars"
								style={{
									backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
									borderRadius: 4,
								}}
							>
								{note === -1
									? undefined
									: events.count() <= 8
										? midiNoteToNoteName(note) + getOctaveFromMidiNote(note).toString()
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
							onMouseEnter={handleMouseEnter}
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

type HandleMouseEvent = (event: React.MouseEvent, note: IMidiNote, index: number) => void

const ColorGridNote = React.memo(
	function _ColorGridNote({note, index, height, top, onMouseDown, onMouseEnter}:
	{note: IMidiNote, index: number, height: number, top: number, onMouseDown: HandleMouseEvent, onMouseEnter: HandleMouseEvent},
	) {
		return (
			<div
				className="event noDrag"
				onMouseDown={e => onMouseDown(e, note, index)}
				onMouseEnter={e => onMouseEnter(e, note, index)}
				title={stripIndents`Left click and drag to play notes
					Shift + left click and drag up and down to change note
					Shift + right click to delete`}
				onContextMenu={e => e.preventDefault()}
			>
				<div
					className="note"
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
