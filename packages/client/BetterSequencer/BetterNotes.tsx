import React, {useState, useCallback, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {MidiClip, MidiClipEvents} from '@corgifm/common/midi-types'
import {betterSequencerActions, sequencerActions} from '@corgifm/common/redux'
import {smallestNoteLength} from '@corgifm/common/BetterConstants'
import {sumPoints} from '@corgifm/common/common-utils'
import {MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'

interface Props {
	id: Id
	noteHeight: number
	columnWidth: number
	panPixels: Point
	midiClip: MidiClip
	selected: Set<Id>
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	clearSelected: () => void
	lengthBeats: number
	zoom: Point
	width: number
	height: number
	rows: string[]
	clientMousePositionToPercentages: (clientMousePosition: Point) => Point
}

export const BetterNotes = (props: Props) => {
	const {
		id, panPixels, noteHeight, columnWidth, selected, onNoteSelect,
		clearSelected, midiClip, lengthBeats, zoom, width, height, rows,
		clientMousePositionToPercentages,
	} = props

	const [noteResizeActive, setNoteResizeActive] = useState<false | 'left' | 'right'>(false)
	const [noteMoveActive, setNoteMoveActive] = useState(false)
	const [persistentDelta, setPersistentDelta] = useState({x: 0, y: 0})
	const [startEvents, setStartEvents] = useState(MidiClipEvents())
	const [startMouseNote, setStartMouseNote] = useState(0)
	const [clickedEvent, setClickedEvent] = useState<Id>('')

	const dispatch = useDispatch()

	const resizeNotes = useCallback(({movementX, altKey}: MouseEvent) => {
		if (!noteResizeActive) return

		const newPersistentDelta = {x: persistentDelta.x + movementX, y: 0}
		const direction = noteResizeActive === 'left' ? -1 : 1
		const beatDelta = movementXToBeats(newPersistentDelta.x, lengthBeats, zoom.x, width) * direction
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				durationBeats: Math.max(smallestNoteLength, Math.min(lengthBeats, event.durationBeats + roundedBeatDelta)),
				startBeat: noteResizeActive === 'left'
					? Math.min(event.startBeat + event.durationBeats, event.startBeat - roundedBeatDelta)
					: event.startBeat,
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta, lengthBeats, zoom.x, width, startEvents, dispatch, id])

	const clientYToMouseNote = useCallback((clientY: number) => {
		return (rows.length) - (clientMousePositionToPercentages({x: 0, y: clientY}).y * rows.length)
	}, [clientMousePositionToPercentages, rows.length])

	const moveNotes = useCallback(({movementX, clientY, altKey}: MouseEvent) => {
		if (!noteMoveActive) return

		const newPersistentDelta = sumPoints(persistentDelta, {x: movementX, y: 0})
		const beatDelta = movementXToBeats(newPersistentDelta.x, lengthBeats, zoom.x, width)
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)
		const mouseNoteDelta = clientYToMouseNote(clientY) - startMouseNote

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				startBeat: Math.max(0, Math.min(lengthBeats - smallestNoteLength, event.startBeat + roundedBeatDelta)),
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, Math.floor(event.note + mouseNoteDelta))),
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteMoveActive, persistentDelta, lengthBeats, zoom.x, width, clientYToMouseNote, startEvents, dispatch, id, startMouseNote])

	const startNoteResizing = useCallback((direction: 'left' | 'right') => {
		setNoteResizeActive(direction)
	}, [])

	const stopNoteResizing = useCallback(() => {
		setNoteResizeActive(false)
	}, [])

	const startNoteMoving = useCallback((clientY: number) => {
		setStartMouseNote(Math.floor(clientYToMouseNote(clientY)))
		setNoteMoveActive(true)
	}, [clientYToMouseNote])

	const stopNoteMoving = useCallback(() => {
		setNoteMoveActive(false)
	}, [])

	const handleMouseDown = useCallback((e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => {
		setClickedEvent(eventId)
		dispatch(sequencerActions.saveUndo(id))
		setPersistentDelta({x: 0, y: 0})
		if (!selected.has(eventId)) {
			if (e.shiftKey) {
				onNoteSelect(eventId, true, false)
				setStartEvents(midiClip.events.filter(x => selected.has(x.id) || x.id === eventId))
			} else {
				onNoteSelect(eventId, true, true)
				setStartEvents(midiClip.events.filter(x => x.id === eventId))
			}
		} else {
			setStartEvents(midiClip.events.filter(x => selected.has(x.id)))
		}
		if (direction !== 'center') {
			startNoteResizing(direction)
		} else {
			startNoteMoving(e.clientY)
		}
	}, [dispatch, id, midiClip.events, onNoteSelect, selected, startNoteMoving, startNoteResizing])

	// Note mouse resize
	useLayoutEffect(() => {
		const stopActive = () => {
			if (noteResizeActive) return stopNoteResizing()
			if (noteMoveActive) return stopNoteMoving()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopActive()
			if (noteResizeActive) return resizeNotes(e)
			if (noteMoveActive) return moveNotes(e)
		}

		const onMouseUp = (e: MouseEvent) => {
			if ((noteResizeActive || noteMoveActive) && !e.shiftKey && persistentDelta.x === 0 && persistentDelta.y === 0) {
				onNoteSelect(clickedEvent, true, true)
			}
			stopActive()
		}

		if (noteResizeActive || noteMoveActive) {
			window.addEventListener('mousemove', onMouseMove)
			window.addEventListener('mouseup', onMouseUp)
		}

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [resizeNotes, noteMoveActive, noteResizeActive, stopNoteMoving, stopNoteResizing, moveNotes, persistentDelta, onNoteSelect, clickedEvent])

	return (
		<div
			className={`notes active-${noteResizeActive}`}
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
				{midiClip.events.map(event => {
					return (
						<BetterNote
							key={event.id.toString()}
							{...{
								id,
								event,
								noteHeight,
								columnWidth,
								isSelected: selected.has(event.id),
								panPixels,
								onNoteSelect,
								handleMouseDown,
								rows,
							}}
						/>
					)
				}).toList()}
			</div>
		</div>
	)
}

function getMovement(e: MouseEvent) {
	return {
		x: e.movementX,
		y: e.movementY,
	} as const
}

function getClientMousePosition(e: MouseEvent) {
	return {
		x: e.clientX,
		y: e.clientY,
	} as const
}
