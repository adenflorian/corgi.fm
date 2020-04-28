import React, {useMemo, useState, useCallback, useLayoutEffect} from 'react'
import * as Immutable from 'immutable'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'
import {MidiTrackClipView} from './MidiTrackClipView'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiTrackClipZoneLines} from './MidiTrackClipZoneLines'
import {useDispatch} from 'react-redux'
import {expMidiTimelineClipsActions, seqTimelineClipToState} from '@corgifm/common/redux'
import {SeqTimelineClips} from '@corgifm/common/SeqStuff'
import {movementXToBeats} from './MidiTrackHelpers'
import {maxClipStartBeat, smallestClipLength} from './MidiTrackConstants'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
}

export const MidiTrackClipZone = ({
	columnWidth, panPixelsX, clipZoneHeight,
}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)
	const [noteMoveActive, setNoteMoveActive] = useState(false)
	const dispatch = useDispatch()



	const [noteResizeActive, setNoteResizeActive] = useState<false | 'left' | 'right'>(false)
	const [noteCloneActive, setNoteCloneActive] = useState(false)
	const [firstMouseMove, setFirstMouseMove] = useState(false)
	const [persistentDelta, setPersistentDelta] = useState({x: 0, y: 0})
	const [startClips, setStartClips] = useState(SeqTimelineClips())
	const [startMouseNote, setStartMouseNote] = useState(0)
	const [clickedEvent, setClickedEvent] = useState<Id>('')

	const [selected, setSelected] = useState(Immutable.Set<Id>())
	const [originalSelected, setOriginalSelected] = useState(Immutable.Set<Id>())
	const clearSelected = useCallback(() => setSelected(Immutable.Set()), [])

	const startClipResizing = useCallback((direction: 'left' | 'right') => {
		setNoteResizeActive(direction)
	}, [])

	const stopClipResizing = useCallback(() => {
		setNoteResizeActive(false)
	}, [])

	const startNoteMoving = useCallback((clientY: number) => {
		setFirstMouseMove(false)
		setNoteMoveActive(true)
	}, [])

	// const stopNoteMoving = useCallback(() => {
	// 	setNoteMoveActive(false)
	// 	removeDuplicateEvents()
	// }, [removeDuplicateEvents])

	const startNoteCloning = useCallback((clientY: number) => {
		setFirstMouseMove(false)
		setNoteCloneActive(true)
	}, [])

	// const stopNoteCloning = useCallback(() => {
	// 	setNoteCloneActive(false)
	// 	removeDuplicateEvents()
	// }, [removeDuplicateEvents])

	const onNoteSelect = useCallback(
		(eventId: Id, select: boolean, clear: boolean) => {
			const foo = clear ? Immutable.Set() : selected
			if (select) {
				setSelected(foo.add(eventId))
			} else {
				setSelected(foo.remove(eventId))
			}
		},
		[selected],
	)

	const handleMouseDown = useCallback((e: MouseEvent, direction: 'left' | 'right' | 'center', clickedEventId: Id) => {
		if (e.ctrlKey && e.altKey) return

		setClickedEvent(clickedEventId)
		// dispatch(sequencerActions.saveUndo(id))
		setPersistentDelta({x: 0, y: 0})

		const {timelineClips} = nodeContext.midiTimelineTrackParam.value.current

		if (!selected.has(clickedEventId)) {
			if (e.shiftKey) {
				onNoteSelect(clickedEventId, true, false)
				setStartClips(timelineClips.filter(x => selected.has(x.id) || x.id === clickedEventId))
			} else {
				onNoteSelect(clickedEventId, true, true)
				setStartClips(timelineClips.filter(x => x.id === clickedEventId))
			}
		} else if (e.shiftKey) {
			onNoteSelect(clickedEventId, false, false)
			return
		} else {
			setStartClips(timelineClips.filter(x => selected.has(x.id)))
		}
		// if (e.ctrlKey) {
		// 	startNoteCloning(e.clientY)
		// } else 
		if (direction !== 'center') {
			startClipResizing(direction)
		} 
		// else {
		// 	startNoteMoving(e.clientY)
		// }
	}, [dispatch, startNoteCloning, startNoteMoving, startClipResizing])

	const resizeClips = useCallback(({movementX, altKey}: MouseEvent) => {
		if (!noteResizeActive) return

		const newPersistentDelta = {x: persistentDelta.x + movementX, y: 0}
		const direction = noteResizeActive === 'left' ? -1 : 1
		const beatDelta = movementXToBeats(newPersistentDelta.x, columnWidth) * direction
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)

		const updatedClips = startClips.map(clip => {
			return {
				...clip,
				beatLength: Math.max(smallestClipLength, Math.min(maxClipStartBeat, clip.beatLength + roundedBeatDelta)),
				startBeat: noteResizeActive === 'left'
					? Math.min(clip.startBeat + clip.beatLength, clip.startBeat - roundedBeatDelta)
					: clip.startBeat,
			}
		})

		dispatch(expMidiTimelineClipsActions.updateMany(updatedClips.map(x => seqTimelineClipToState(x))))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta.x, columnWidth, startClips, dispatch, maxClipStartBeat])

	// Note mouse resize
	useLayoutEffect(() => {
		const stopActive = () => {
			if (noteResizeActive) return stopClipResizing()
			// if (noteMoveActive) return stopNoteMoving()
			// if (noteCloneActive) return stopNoteCloning()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopActive()
			if (noteResizeActive) return resizeClips(e)
			// if (noteMoveActive) return moveNotes(e)
			// if (noteCloneActive) return cloneNotes(e)
		}

		const onMouseUp = (e: MouseEvent) => {
			// if ((noteResizeActive || noteMoveActive || noteCloneActive) && !e.shiftKey && persistentDelta.x === 0 && persistentDelta.y === 0) {
			// 	onNoteSelect(clickedEvent, true, true)
			// }
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
	}, [resizeClips, noteMoveActive, noteResizeActive, /*stopNoteMoving,*/
		stopClipResizing, /*moveNotes, */persistentDelta, /*onNoteSelect,*/
		clickedEvent, /*stopNoteCloning, */noteCloneActive/*, cloneNotes*/])

	return (
		<div className={`moving-${noteMoveActive}`} style={{height: '100%'}}>
			<MidiTrackClipZoneLines {...{clipZoneHeight, panPixelsX, columnWidth}} />
			<div
				className="midiTrackClipZoneInner"
				style={{
					padding: '8px 0px 8px 0px',
					boxSizing: 'border-box',
					height: '100%',
				}}
			>
				<div
					className="midiTrackClipZoneInnerPadded"
					style={{
						height: '100%',
						position: 'relative',
					}}
				>
					{track.timelineClips.map(clip =>
						<MidiTrackClipView
							key={clip.id as string}
							clip={clip}
							columnWidth={columnWidth}
							panPixelsX={panPixelsX}
							handleMouseDown={handleMouseDown}
						/>
					).toList()}
				</div>
			</div>
		</div>
	)
}
