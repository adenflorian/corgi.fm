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
import {sumPoints} from '@corgifm/common/common-utils'
import {logger} from '../../../client-logger'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
	readonly visibleWidth: number
}

export const MidiTrackClipZone = ({
	columnWidth, panPixelsX, clipZoneHeight, visibleWidth,
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

	const startNoteMoving = useCallback(() => {
		setFirstMouseMove(false)
		setNoteMoveActive(true)
	}, [])

	const stopNoteMoving = useCallback(() => {
		setNoteMoveActive(false)
		// removeDuplicateEvents()
	}, [/*removeDuplicateEvents*/])

	const startNoteCloning = useCallback(() => {
		setFirstMouseMove(false)
		setNoteCloneActive(true)
	}, [])

	const stopNoteCloning = useCallback(() => {
		setNoteCloneActive(false)
		// removeDuplicateEvents()
	}, [/*removeDuplicateEvents*/])

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
		} else {
			startNoteMoving()
		}
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

		dispatch(expMidiTimelineClipsActions.updateMany(updatedClips.map(seqTimelineClipToState)))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta.x, columnWidth, startClips, dispatch, maxClipStartBeat])

	const moveClipsHorizontally = useCallback((direction: 1 | -1, alt: boolean) => {
		dispatch(expMidiTimelineClipsActions.updateMany(selected.reduce((clips, clipId) => {
			const originalClip = nodeContext.midiTimelineTrackParam.value.current.timelineClips.get(clipId, null)

			if (originalClip === null) {
				logger.warn('MidiTrackClipZone [moveClipsHorizontally] originalEvent === null')
				return clips
			}

			const delta = (alt ? smallestClipLength : 1) * direction

			return clips.set(clipId, {
				...originalClip,
				startBeat: Math.max(0, Math.min(maxClipStartBeat, originalClip.startBeat + delta)),
			})
		}, SeqTimelineClips()).map(seqTimelineClipToState)))
	}, [dispatch, selected])

	const moveNotes = useCallback(({movementX, clientY, altKey}: MouseEvent) => {
		if (!noteMoveActive) return

		if (!firstMouseMove) {
			setFirstMouseMove(true)
			return
		}

		const newPersistentDelta = sumPoints(persistentDelta, {x: movementX, y: 0})
		const beatDelta = movementXToBeats(newPersistentDelta.x, columnWidth)
		const roundedBeatDelta = altKey
			? beatDelta
			: Math.round(beatDelta)

		const updatedClips = startClips.map(clip => {
			return {
				...clip,
				startBeat: Math.max(0, Math.min(maxClipStartBeat, clip.startBeat + roundedBeatDelta)),
			}
		})

		dispatch(expMidiTimelineClipsActions.updateMany(updatedClips.map(x => seqTimelineClipToState(x))))
		setPersistentDelta(newPersistentDelta)
	}, [noteMoveActive, firstMouseMove, persistentDelta, columnWidth,
		startMouseNote, startClips, dispatch])

	// Note mouse resize
	useLayoutEffect(() => {
		const stopActive = () => {
			if (noteResizeActive) return stopClipResizing()
			if (noteMoveActive) return stopNoteMoving()
			// if (noteCloneActive) return stopNoteCloning()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopActive()
			if (noteResizeActive) return resizeClips(e)
			if (noteMoveActive) return moveNotes(e)
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
		stopClipResizing, moveNotes, persistentDelta, /*onNoteSelect,*/
		clickedEvent, /*stopNoteCloning, */noteCloneActive/*, cloneNotes*/])

	return (
		<div
			className={`midiTrackClipZone moving-${noteMoveActive}`}
			style={{
				height: clipZoneHeight,
				width: visibleWidth,
				backgroundColor: CssColor.panelGray,
				overflow: 'hidden',
				position: 'relative',
			}}
			onMouseDown={e => {
				if (e.button !== 0 || e.shiftKey) return
				clearSelected()
			}}
		>
			<MidiTrackClipZoneLines {...{clipZoneHeight, panPixelsX, columnWidth, visibleWidth}} />
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
							clipZoneHeight={clipZoneHeight}
							isSelected={selected.has(clip.id)}
						/>
					).toList()}
				</div>
			</div>
		</div>
	)
}
