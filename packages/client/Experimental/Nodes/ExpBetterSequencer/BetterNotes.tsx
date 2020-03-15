import React, {useState, useCallback, useLayoutEffect, Fragment} from 'react'
import {useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {ExpMidiPatternState, expMidiPatternsActions} from '@corgifm/common/redux'
import {smallestNoteLength} from '@corgifm/common/BetterConstants'
import {sumPoints} from '@corgifm/common/common-utils'
import {MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {oneLine} from 'common-tags'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'
import {SeqEvents, duplicateNoteEvent} from '@corgifm/common/SeqStuff'

interface Props {
	noteHeight: number
	columnWidth: number
	panPixels: Point
	expMidiPattern: ExpMidiPatternState
	selected: Set<Id>
	setSelected: (newSelected: Set<Id>) => void
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	clearSelected: () => void
	lengthBeats: number
	zoom: Point
	width: number
	height: number
	rows: string[]
	clientMousePositionToPercentages: (clientMousePosition: Point) => Point
	removeDuplicateEvents: () => void
}

export const BetterNotes = React.memo(function _BetterNotes(props: Props) {
	const {
		panPixels, noteHeight, columnWidth, selected, onNoteSelect,
		clearSelected, expMidiPattern, lengthBeats, zoom, width, height, rows,
		clientMousePositionToPercentages, setSelected, removeDuplicateEvents,
	} = props

	const [noteResizeActive, setNoteResizeActive] = useState<false | 'left' | 'right'>(false)
	const [noteMoveActive, setNoteMoveActive] = useState(false)
	const [noteCloneActive, setNoteCloneActive] = useState(false)
	const [firstMouseMove, setFirstMouseMove] = useState(false)
	const [persistentDelta, setPersistentDelta] = useState({x: 0, y: 0})
	const [startEvents, setStartEvents] = useState(SeqEvents())
	const [startMouseNote, setStartMouseNote] = useState(0)
	const [clickedEvent, setClickedEvent] = useState<Id>('')

	const dispatch = useDispatch()

	const resizeNotes = useCallback(({movementX, altKey}: MouseEvent) => {
		if (!noteResizeActive) return

		const newPersistentDelta = {x: persistentDelta.x + movementX, y: 0}
		const direction = noteResizeActive === 'left' ? -1 : 1
		const beatDelta = movementXToBeats(newPersistentDelta.x, columnWidth) * direction
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				duration: Math.max(smallestNoteLength, Math.min(lengthBeats, event.duration + roundedBeatDelta)),
				startBeat: noteResizeActive === 'left'
					? Math.min(event.startBeat + event.duration, event.startBeat - roundedBeatDelta)
					: event.startBeat,
			}
		})

		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta.x, columnWidth, startEvents, dispatch, expMidiPattern.id, lengthBeats])

	const clientYToMouseNote = useCallback((clientY: number) => {
		return (rows.length) - (clientMousePositionToPercentages({x: 0, y: clientY}).y * rows.length)
	}, [clientMousePositionToPercentages, rows.length])

	const moveNotes = useCallback(({movementX, clientY, altKey}: MouseEvent) => {
		if (!noteMoveActive) return

		if (!firstMouseMove) {
			setFirstMouseMove(true)
			setStartMouseNote(Math.floor(clientYToMouseNote(clientY)))
			return
		}

		const newPersistentDelta = sumPoints(persistentDelta, {x: movementX, y: 0})
		const beatDelta = movementXToBeats(newPersistentDelta.x, columnWidth)
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)
		const mouseNoteDelta = clientYToMouseNote(clientY) - startMouseNote

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				startBeat: Math.max(0, Math.min(lengthBeats - event.duration, event.startBeat + roundedBeatDelta)),
				// TODO clampMidiNote
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, Math.floor(event.note + mouseNoteDelta))),
			}
		})

		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteMoveActive, firstMouseMove, persistentDelta, columnWidth,
			clientYToMouseNote, startMouseNote, startEvents, dispatch, expMidiPattern.id, lengthBeats])

	const cloneNotes = useCallback(({movementX, clientY, altKey}: MouseEvent) => {
		if (!noteCloneActive) return

		if (!firstMouseMove) {
			const newEvents = startEvents
				.reduce((result, event) => {
					const newEvent = duplicateNoteEvent(event)
					return result.set(newEvent.id, newEvent)
				}, SeqEvents())

			dispatch(expMidiPatternsActions.addEvents(expMidiPattern.id, newEvents))
			setSelected(newEvents.keySeq().toSet())
			setStartEvents(newEvents)
			setFirstMouseMove(true)
			setStartMouseNote(Math.floor(clientYToMouseNote(clientY)))
			return
		}

		const newPersistentDelta = sumPoints(persistentDelta, {x: movementX, y: 0})
		const beatDelta = movementXToBeats(newPersistentDelta.x, columnWidth)
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)
		const mouseNoteDelta = clientYToMouseNote(clientY) - startMouseNote

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				startBeat: Math.max(0, Math.min(lengthBeats - event.duration, event.startBeat + roundedBeatDelta)),
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, Math.floor(event.note + mouseNoteDelta))),
			}
		})

		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [clientYToMouseNote, columnWidth, dispatch, firstMouseMove,
		expMidiPattern.id, lengthBeats, noteCloneActive, persistentDelta,
		setSelected, startEvents, startMouseNote])

	const startNoteResizing = useCallback((direction: 'left' | 'right') => {
		setNoteResizeActive(direction)
	}, [])

	const stopNoteResizing = useCallback(() => {
		setNoteResizeActive(false)
	}, [])

	const startNoteMoving = useCallback((clientY: number) => {
		setFirstMouseMove(false)
		setNoteMoveActive(true)
	}, [])

	const stopNoteMoving = useCallback(() => {
		setNoteMoveActive(false)
		removeDuplicateEvents()
	}, [removeDuplicateEvents])

	const startNoteCloning = useCallback((clientY: number) => {
		setFirstMouseMove(false)
		setNoteCloneActive(true)
	}, [])

	const stopNoteCloning = useCallback(() => {
		setNoteCloneActive(false)
		removeDuplicateEvents()
	}, [removeDuplicateEvents])

	const handleMouseDown = useCallback((e: MouseEvent, direction: 'left' | 'right' | 'center', clickedEventId: Id) => {
		if (e.ctrlKey && e.altKey) return

		setClickedEvent(clickedEventId)
		// TODO
		// dispatch(sequencerActions.saveUndo(id))
		setPersistentDelta({x: 0, y: 0})

		if (!selected.has(clickedEventId)) {
			if (e.shiftKey) {
				onNoteSelect(clickedEventId, true, false)
				setStartEvents(expMidiPattern.events.filter(x => selected.has(x.id) || x.id === clickedEventId))
			} else {
				onNoteSelect(clickedEventId, true, true)
				setStartEvents(expMidiPattern.events.filter(x => x.id === clickedEventId))
			}
		} else if (e.shiftKey) {
			onNoteSelect(clickedEventId, false, false)
			return
		} else {
			setStartEvents(expMidiPattern.events.filter(x => selected.has(x.id)))
		}
		if (e.ctrlKey) {
			startNoteCloning(e.clientY)
		} else if (direction !== 'center') {
			startNoteResizing(direction)
		} else {
			startNoteMoving(e.clientY)
		}
	}, [dispatch, expMidiPattern.events, onNoteSelect, selected, startNoteCloning, startNoteMoving, startNoteResizing])

	// Note mouse resize
	useLayoutEffect(() => {
		const stopActive = () => {
			if (noteResizeActive) return stopNoteResizing()
			if (noteMoveActive) return stopNoteMoving()
			if (noteCloneActive) return stopNoteCloning()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopActive()
			if (noteResizeActive) return resizeNotes(e)
			if (noteMoveActive) return moveNotes(e)
			if (noteCloneActive) return cloneNotes(e)
		}

		const onMouseUp = (e: MouseEvent) => {
			if ((noteResizeActive || noteMoveActive || noteCloneActive) && !e.shiftKey && persistentDelta.x === 0 && persistentDelta.y === 0) {
				onNoteSelect(clickedEvent, true, true)
			}
			stopActive()
		}

		if (noteResizeActive || noteMoveActive || noteCloneActive) {
			window.addEventListener('mousemove', onMouseMove)
			window.addEventListener('mouseup', onMouseUp)
		}

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [resizeNotes, noteMoveActive, noteResizeActive, stopNoteMoving,
		stopNoteResizing, moveNotes, persistentDelta, onNoteSelect,
		clickedEvent, stopNoteCloning, noteCloneActive, cloneNotes])

	return (
		<div
			className={oneLine`
				notes
				active-${noteResizeActive}
				resizing-${noteResizeActive}
				moving-${noteMoveActive}
				cloning-${noteCloneActive}
			`}
		>
			<svg
				className="scalable"
				onMouseDown={e => {
					if (e.button !== 0 || e.shiftKey) return
					clearSelected()
				}}
			>
				<ActualNotes
					noteHeight={noteHeight}
					columnWidth={columnWidth}
					expMidiPattern={expMidiPattern}
					selected={selected}
					onNoteSelect={onNoteSelect}
					rows={rows}
					handleMouseDown={handleMouseDown}
				/>
			</svg>
		</div>
	)
})

interface ActualNotesProps {
	noteHeight: number
	columnWidth: number
	expMidiPattern: ExpMidiPatternState
	selected: Set<Id>
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	rows: string[]
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', clickedEventId: Id) => void
}

const ActualNotes = React.memo(function _ActualNotes({expMidiPattern, noteHeight, columnWidth, selected, onNoteSelect, handleMouseDown, rows}: ActualNotesProps) {
	return (
		<Fragment>
			{expMidiPattern.events.map(event => {
				return (
					<BetterNote
						key={event.id.toString()}
						{...{
							event,
							noteHeight,
							columnWidth,
							isSelected: selected.has(event.id),
							onNoteSelect,
							handleMouseDown,
							rows,
						}}
					/>
				)
			}).toList()}
		</Fragment>
	)
})

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