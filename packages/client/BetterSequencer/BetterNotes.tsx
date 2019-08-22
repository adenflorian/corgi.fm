import React, {useState, useCallback, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {Map} from 'immutable'
import {MidiClip, MidiClipEvents} from '@corgifm/common/midi-types'
import {betterSequencerActions} from '@corgifm/common/redux'
import {smallestNoteLength} from '@corgifm/common/BetterConstants'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'

interface ActiveInfo {
	hoz: 'left' | 'right'
}

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

	const [active, setActive] = useState<false | 'left' | 'right'>(false)
	const [persistentDelta, setPersistentDelta] = useState(0)
	const [startEvents, setStartEvents] = useState(MidiClipEvents())

	const dispatch = useDispatch()

	const onMouseMove = useCallback((tempDelta: number) => {
		if (!active) return

		const newPersistentDelta = persistentDelta + tempDelta

		// const maxX = start.x + (start.width - defaultWidth)

		const direction = active === 'left' ? -1 : 1

		const doo = movementXToBeats(newPersistentDelta, lengthBeats, zoomX, width) * direction

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				durationBeats: Math.max(smallestNoteLength, Math.min(lengthBeats, event.durationBeats + doo)),
				startBeat: active === 'left'
					? Math.min(event.startBeat + event.durationBeats, event.startBeat - doo)
					: event.startBeat,
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents))

		setPersistentDelta(newPersistentDelta)
	}, [active, persistentDelta, lengthBeats, zoomX, width, startEvents, dispatch, id])

	const setInactive = useCallback(() => {
		setActive(false)
	}, [setActive])

	const handleMouseDown = useCallback((direction: 'left' | 'right', eventId: Id) => {
		if (selected.get(eventId) !== true) {
			onNoteSelect(eventId, true, true)
			setStartEvents(midiClip.events.filter(x => x.id === eventId))
		} else {
			setStartEvents(midiClip.events.filter(x => selected.get(x.id) === true || x.id === eventId))
		}
		setPersistentDelta(0)
		setActive(direction)
	}, [setPersistentDelta, setStartEvents, midiClip.events, selected, setActive, onNoteSelect])

	// Note mouse resize
	useLayoutEffect(() => {
		const foo = (e: MouseEvent) => {
			if (e.buttons !== 1) return setInactive()
			onMouseMove(e.movementX)
		}

		const onMouseUp = () => {
			if (active) {
				setInactive()
			}
		}

		if (active) {
			window.addEventListener('mousemove', foo)
			window.addEventListener('mouseup', onMouseUp)
		}

		return () => {
			window.removeEventListener('mousemove', foo)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [onMouseMove, active, setInactive])

	return (
		<div
			className={`notes active-${active}`}
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

function getNewX(active: ActiveInfo, x: number, delta: Point) {
	return active.hoz === 'left'
		? x + delta.x
		: x
}

function getNewWidth(active: ActiveInfo, width: number, delta: Point) {
	return active.hoz === 'left'
		? width - delta.x
		: active.hoz === 'right'
			? width + delta.x
			: width
}
