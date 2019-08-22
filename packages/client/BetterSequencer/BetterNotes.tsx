import React, {useState, useCallback, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {Map} from 'immutable'
import {MidiClip, MidiClipEvents} from '@corgifm/common/midi-types'
import {betterSequencerActions, sequencerActions} from '@corgifm/common/redux'
import {smallestNoteLength} from '@corgifm/common/BetterConstants'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'

interface Props {
	id: Id
	noteHeight: number
	columnWidth: number
	panPixels: Point
	midiClip: MidiClip
	selected: Map<Id, boolean>
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	clearSelected: () => void
	lengthBeats: number
	zoomX: number
	width: number
}

export const BetterNotes = (props: Props) => {
	const {
		id, panPixels, noteHeight, columnWidth, selected, onNoteSelect,
		clearSelected, midiClip, lengthBeats, zoomX, width,
	} = props

	const [noteResizeActive, setNoteResizeActive] = useState<false | 'left' | 'right'>(false)
	const [noteMoveActive, setNoteMoveActive] = useState(false)
	const [persistentDelta, setPersistentDelta] = useState(0)
	const [startEvents, setStartEvents] = useState(MidiClipEvents())

	const dispatch = useDispatch()

	const onMouseMove = useCallback((tempDelta: number) => {
		if (!noteResizeActive) return

		const newPersistentDelta = persistentDelta + tempDelta
		const direction = noteResizeActive === 'left' ? -1 : 1
		const doo = movementXToBeats(newPersistentDelta, lengthBeats, zoomX, width) * direction

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				durationBeats: Math.max(smallestNoteLength, Math.min(lengthBeats, event.durationBeats + doo)),
				startBeat: noteResizeActive === 'left'
					? Math.min(event.startBeat + event.durationBeats, event.startBeat - doo)
					: event.startBeat,
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta, lengthBeats, zoomX, width, startEvents, dispatch, id])

	const startNoteResizing = useCallback((direction: 'left' | 'right', eventId: Id) => {
		if (selected.get(eventId) !== true) {
			onNoteSelect(eventId, true, true)
			setStartEvents(midiClip.events.filter(x => x.id === eventId))
		} else {
			setStartEvents(midiClip.events.filter(x => selected.get(x.id) === true || x.id === eventId))
		}
		setNoteResizeActive(direction)
		dispatch(sequencerActions.saveUndo(id))
	}, [dispatch, id, midiClip.events, onNoteSelect, selected])

	const stopNoteResizing = useCallback(() => {
		setNoteResizeActive(false)
	}, [])

	const startNoteMoving = useCallback(() => {
		setNoteMoveActive(true)
	}, [])

	const handleMouseDown = useCallback((direction: 'left' | 'right' | 'center', eventId: Id) => {
		setPersistentDelta(0)
		if (direction !== 'center') {
			startNoteResizing(direction, eventId)
		} else {
			startNoteMoving()
		}
	}, [startNoteMoving, startNoteResizing])

	// Note mouse resize
	useLayoutEffect(() => {
		const foo = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopNoteResizing()
			onMouseMove(e.movementX)
		}

		const onMouseUp = () => {
			if (noteResizeActive) {
				stopNoteResizing()
			}
		}

		if (noteResizeActive) {
			window.addEventListener('mousemove', foo)
			window.addEventListener('mouseup', onMouseUp)
		}

		return () => {
			window.removeEventListener('mousemove', foo)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [onMouseMove, noteResizeActive, stopNoteResizing])

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
								handleMouseDown,
							}}
						/>
					)
				}).toList()}
			</div>
		</div>
	)
}
