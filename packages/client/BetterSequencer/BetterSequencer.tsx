import React, {
	useCallback, useState, useEffect, useRef, useLayoutEffect,
} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Map, OrderedMap, Set} from 'immutable'
import {stripIndents, oneLine} from 'common-tags'
import {
	createPositionColorSelector, createBetterSeqIsRecordingSelector,
	createBetterSeqIsPlayingSelector, createBetterSeqRateSelector, getNodeInfo,
	createBetterSeqLengthSelector, createBetterSeqZoomSelector,
	createBetterSeqMidiClipSelector, createBetterSeqPanSelector,
	createPositionHeightSelector, createPositionWidthSelector, sequencerActions,
	betterSequencerActions, createPositionXSelector, createPositionYSelector,
	localActions,
} from '@corgifm/common/redux'
import {
	Key, MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0,
} from '@corgifm/common/common-constants'
import {clamp} from '@corgifm/common/common-utils'
import {MidiClipEvent, makeMidiClipEvent, MidiClipEvents} from '@corgifm/common/midi-types'
import {Panel} from '../Panel/Panel'
import {
	seqLengthValueToString,
} from '../client-constants'
import './BetterSequencer.less'
import {
	makeMouseMovementAccountForGlobalZoom,
} from '../SimpleGlobalClientState'
import {useBoolean} from '../react-hooks'
import {logger} from '../client-logger'
import {BoxSelect} from './BoxSelect'
import {BetterRows} from './BetterRows'
import {BetterColumns} from './BetterColumns'
import {BetterNotes} from './BetterNotes'
import {
	minPan, maxPan, minZoomX, maxZoomX, minZoomY, maxZoomY, smallestNoteLength,
} from './BetterConstants'
import {BetterSequencerControls} from './BetterSequencerControls'
import {
	clientSpaceToPercentages, getMaxPan, eventToNote, editorSpaceToPercentages,
	clientSpaceToEditorSpace,
} from './BetterSequencerHelpers'

interface Props {
	id: Id
}

const controlsWidth = 64

const mouseWheelYSensitivity = 0.001
const mouseWheelPanXSensitivity = 0.001
const mouseWheelZoomXSensitivity = 0.01
const mouseWheelZoomYSensitivity = 0.01
const middleMousePanXSensitivity = 0.001
const middleMousePanYSensitivity = 0.001

export const BetterSequencer = ({id}: Props) => {
	const color = useSelector(createPositionColorSelector(id))
	const isRecording = useSelector(createBetterSeqIsRecordingSelector(id))
	const isPlaying = useSelector(createBetterSeqIsPlayingSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))
	const lengthBeats = useSelector(createBetterSeqLengthSelector(id))
	const zoom = useSelector(createBetterSeqZoomSelector(id))
	const pan = useSelector(createBetterSeqPanSelector(id))
	const midiClip = useSelector(createBetterSeqMidiClipSelector(id))
	const x = useSelector(createPositionXSelector(id))
	const y = useSelector(createPositionYSelector(id))
	const height = useSelector(createPositionHeightSelector(id))
	const width = useSelector(createPositionWidthSelector(id)) - controlsWidth
	const isNodeSelected = useSelector(createPositionHeightSelector(id))

	const [selected, setSelected] = useState(Map<Id, boolean>())
	const clearSelected = () => setSelected(Map())

	// Box Select
	const [boxActive, activateBox, deactivateBox] = useBoolean(false)
	const [boxOrigin, setBoxOrigin] = useState({x: 0, y: 0})
	const [otherCorner, setOtherCorner] = useState({x: 0, y: 0})

	// Middle mouse pan
	const [middleMouseActive, activateMiddleMouse, deactivateMiddleMouse] = useBoolean(false)

	const editorElement = useRef<HTMLDivElement>(null)

	const dispatch = useDispatch()

	const scaledHeight = height * zoom.y

	const maxPanY = getMaxPan(height, zoom.y)
	const maxPanX = getMaxPan(width, zoom.x)
	const panPixels = {
		x: pan.x * maxPanX,
		y: pan.y * maxPanY,
	}

	const noteHeight = scaledHeight / 128

	// Wheel events
	useEffect(() => {
		const onWheel = (e: WheelEvent) => {
			if (e.altKey) return

			e.preventDefault()
			e.stopPropagation()

			const bar = clientSpaceToPercentages({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

			if (e.ctrlKey && e.shiftKey) {
				dispatch(sequencerActions.setPan(id, {
					...pan,
					x: clamp(pan.x + (e.deltaY * (mouseWheelPanXSensitivity / zoom.x)), minPan, maxPan),
				}))
			} else if (e.ctrlKey) {
				dispatch(sequencerActions.setZoom(id, {
					...zoom,
					x: clamp(zoom.x + (-e.deltaY * mouseWheelZoomXSensitivity), minZoomX, maxZoomX),
				}))
			} else if (e.shiftKey) {
				dispatch(sequencerActions.setZoom(id, {
					...zoom,
					y: clamp(zoom.y + (-e.deltaY * mouseWheelZoomYSensitivity), minZoomY, maxZoomY),
				}))
				// dispatch(sequencerActions.setPan(id, {
				// 	...pan,
				// 	y: clamp(bar.centerY, minPan, maxPan),
				// }))
			} else {
				dispatch(sequencerActions.setPan(id, {
					...pan,
					y: clamp(pan.y + (e.deltaY * (mouseWheelYSensitivity / zoom.y)), minPan, maxPan),
				}))
			}
		}

		const editorElementNotNull = editorElement.current

		if (editorElementNotNull === null) return

		if (editorElementNotNull) {
			editorElementNotNull.addEventListener('wheel', onWheel)
		}

		return () => {
			if (editorElementNotNull) {
				editorElementNotNull.removeEventListener('wheel', onWheel)
			}
		}
	}, [dispatch, height, id, maxPanX, maxPanY, pan, panPixels, width, x, y, zoom])

	// Double click events
	useEffect(() => {
		const onDoubleClick = (e: MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			const bar = clientSpaceToPercentages({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

			const note = 127 - Math.floor(bar.y * 128)
			const startBeat = Math.floor(bar.x * lengthBeats)

			const newEvent = makeMidiClipEvent({
				durationBeats: 1,
				startBeat,
				note,
			})

			dispatch(betterSequencerActions.addEvent(id, newEvent))
			dispatch(localActions.playShortNote(id, Set([note])))
			setSelected(selected.clear().set(newEvent.id, true))
		}

		const editorElementNotNull = editorElement.current

		if (editorElementNotNull === null) return

		if (editorElementNotNull) {
			editorElementNotNull.addEventListener('dblclick', onDoubleClick)
		}

		return () => {
			if (editorElementNotNull) {
				editorElementNotNull.removeEventListener('dblclick', onDoubleClick)
			}
		}
	}, [dispatch, height, id, lengthBeats, maxPanX, maxPanY, panPixels, selected, width, x, y])

	// Box Select
	useLayoutEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return
			const editorSpace = clientSpaceToEditorSpace(
				{x: e.clientX, y: e.clientY}, {x, y})
			setBoxOrigin(editorSpace)
			setOtherCorner(editorSpace)
			activateBox()
		}

		const onMouseUp = (e: MouseEvent) => {
			if (e.button !== 0) return
			if (boxActive) {
				deactivateBox()
				selectNotes(undefined, e.shiftKey)
			}
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return deactivateBox()
			const editorSpace = clientSpaceToEditorSpace(
				{x: e.clientX, y: e.clientY}, {x, y})
			const clamped = {
				x: clamp(editorSpace.x, 0, width),
				y: clamp(editorSpace.y, 0, height),
			}
			setOtherCorner(clamped)
			selectNotes(clamped, e.shiftKey)
		}

		function selectNotes(otherCorner2 = otherCorner, preserve = false) {
			const originPercentages = editorSpaceToPercentages(boxOrigin, panPixels, maxPanX, maxPanY, width, height)
			const otherCornerPercentages = editorSpaceToPercentages(otherCorner2, panPixels, maxPanX, maxPanY, width, height)
			const box = {
				top: 127 - Math.floor(Math.min(originPercentages.y, otherCornerPercentages.y) * 128),
				bottom: 127 - Math.floor(Math.max(originPercentages.y, otherCornerPercentages.y) * 128),
				left: Math.min(originPercentages.x, otherCornerPercentages.x) * lengthBeats,
				right: Math.max(originPercentages.x, otherCornerPercentages.x) * lengthBeats,
			}

			setSelected(
				midiClip.events.filter(
					z => z.note <= box.top &&
						z.note >= box.bottom &&
						(z.startBeat + z.durationBeats) >= box.left &&
						z.startBeat <= box.right
				)
					.map(_ => true)
					.concat(preserve ? selected : [])
			)
		}

		const editorElementNotNull = editorElement.current

		if (editorElementNotNull === null) return

		editorElementNotNull.addEventListener('mousedown', onMouseDown)

		if (boxActive) {
			window.addEventListener('mousemove', onMouseMove)
		}

		window.addEventListener('mouseup', onMouseUp)

		return () => {
			if (editorElementNotNull) {
				editorElementNotNull.removeEventListener('mousedown', onMouseDown)
				window.removeEventListener('mousemove', onMouseMove)
			}
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [activateBox, boxActive, boxOrigin, deactivateBox, height, lengthBeats, maxPanX, maxPanY, midiClip.events, otherCorner, panPixels, width, x, y, selected])

	// Middle mouse pan
	useLayoutEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 1) return

			activateMiddleMouse()
		}

		const onMouseUp = (e: MouseEvent) => {
			if (e.button !== 1) return
			deactivateMiddleMouse()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 4 || !e.shiftKey) return deactivateMiddleMouse()

			const zoomedMovement = makeMouseMovementAccountForGlobalZoom(
				{x: e.movementX, y: e.movementY})

			dispatch(sequencerActions.setPan(id, {
				x: zoom.x === 1
					? pan.x
					: clamp(
						pan.x + ((-zoomedMovement.x) * (1 / (width * (zoom.x - 1)))),
						minPan, maxPan),
				y: zoom.y === 1
					? pan.y
					: clamp(
						pan.y + ((-zoomedMovement.y) * (1 / (height * (zoom.y - 1)))),
						minPan, maxPan),
			}))
		}

		const editorElementNotNull = editorElement.current

		if (editorElementNotNull === null) return

		editorElementNotNull.addEventListener('mousedown', onMouseDown)

		if (middleMouseActive) {
			window.addEventListener('mousemove', onMouseMove)
		}

		window.addEventListener('mouseup', onMouseUp)

		return () => {
			if (editorElementNotNull) {
				editorElementNotNull.removeEventListener('mousedown', onMouseDown)
				window.removeEventListener('mousemove', onMouseMove)
			}
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [activateMiddleMouse, deactivateMiddleMouse, dispatch, height, id, middleMouseActive, pan, width, zoom])

	const columnWidth = (width * zoom.x) / lengthBeats

	const selectAll = useCallback(() => {
		setSelected(midiClip.events.map(_ => true))
	}, [setSelected, midiClip.events])

	const duplicateNotes = useCallback(() => {
		const eventsToCopy = midiClip.events
			.filter(event => selected.get(event.id) === true)

		const smallX = eventsToCopy.map(e => e.startBeat).min() || 0
		const bigX = eventsToCopy.map(e => e.startBeat + e.durationBeats).max() || 0
		const diff = bigX - smallX

		if (diff === 0) return

		const newEvents = eventsToCopy
			.reduce((result, event) => {
				const newEvent = makeMidiClipEvent({
					...event,
					startBeat: event.startBeat + diff,
				})
				return result.set(newEvent.id, newEvent)
			}, MidiClipEvents())
		dispatch(betterSequencerActions.addEvents(id, newEvents))
		setSelected(newEvents.map(_ => true))
	}, [midiClip.events, dispatch, id, selected])

	const deleteSelected = useCallback(() => {
		dispatch(betterSequencerActions.deleteEvents(id, selected.keySeq()))
		setSelected(Map())
	}, [dispatch, id, selected, setSelected])

	const moveNotesVertically = useCallback((direction: 1 | -1, shift: boolean) => {
		const updatedEvents = selected.reduce((events, _, eventId) => {
			const originalEvent = midiClip.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[moveNotesVertically] originalEvent === null')
				return events
			}

			const delta = (shift ? 12 : 1) * direction

			return events.set(eventId, {
				...originalEvent,
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, originalEvent.note + delta)),
			})
		}, MidiClipEvents())

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents))
		dispatch(localActions.playShortNote(id, updatedEvents.map(eventToNote).toSet()))
	}, [dispatch, id, selected, midiClip.events])

	const moveNotesHorizontally = useCallback((direction: 1 | -1, alt: boolean) => {
		dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
			const originalEvent = midiClip.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[moveNotesHorizontally] originalEvent === null')
				return events
			}

			const delta = (alt ? smallestNoteLength : 1) * direction

			return events.set(eventId, {
				...originalEvent,
				startBeat: Math.max(0, Math.min(lengthBeats - 1, originalEvent.startBeat + delta)),
			})
		}, MidiClipEvents())))
	}, [dispatch, id, selected, midiClip.events, lengthBeats])

	const resizeNotes = useCallback((direction: 1 | -1, alt: boolean) => {
		dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
			const originalEvent = midiClip.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[resizeNotes] originalEvent === null')
				return events
			}

			const delta = (alt ? smallestNoteLength : 1) * direction

			if (direction === 1 && originalEvent.durationBeats === smallestNoteLength && !alt) {
				return events.set(eventId, {
					...originalEvent,
					durationBeats: 1,
				})
			} else {
				return events.set(eventId, {
					...originalEvent,
					durationBeats: Math.max(smallestNoteLength, Math.min(8, originalEvent.durationBeats + delta)),
				})
			}
		}, OrderedMap<Id, MidiClipEvent>())))
	}, [dispatch, id, selected, midiClip.events])

	const onKeyDown = useCallback((e: KeyboardEvent) => {

		if (e.ctrlKey && e.key === Key.a) {
			return selectAll()
		}

		if (e.ctrlKey && e.key === Key.d) {
			// Prevent the whole node from getting duplicated
			e.stopPropagation()
			// Prevent bookmark from being created
			e.preventDefault()
			return duplicateNotes()
		}

		if (e.key === Key.Delete) {
			if (selected.count() === 0) return
			return deleteSelected()
		}

		if (e.key === Key.ArrowUp) {
			e.preventDefault()
			if (selected.count() === 0) return
			return moveNotesVertically(1, e.shiftKey)
		}

		if (e.key === Key.ArrowDown) {
			e.preventDefault()
			if (selected.count() === 0) return
			return moveNotesVertically(-1, e.shiftKey)
		}

		if (e.key === Key.ArrowRight) {
			e.preventDefault()
			if (selected.count() === 0) return

			if (e.shiftKey) {
				resizeNotes(1, e.altKey)
			} else {
				moveNotesHorizontally(1, e.altKey)
			}
			return
		}

		if (e.key === Key.ArrowLeft) {
			e.preventDefault()
			if (selected.count() === 0) return

			if (e.shiftKey) {
				resizeNotes(-1, e.altKey)
			} else {
				moveNotesHorizontally(-1, e.altKey)
			}
			return
		}
	}, [selected, selectAll, deleteSelected, moveNotesVertically, moveNotesHorizontally, resizeNotes, duplicateNotes])

	// Key events
	useEffect(() => {
		const editorElement2 = editorElement.current

		if (editorElement2 === null) return

		if (isNodeSelected) {
			editorElement2.addEventListener('keydown', onKeyDown)
		}

		return () => {
			editorElement2.removeEventListener('keydown', onKeyDown)
		}
	}, [isNodeSelected, onKeyDown])

	const onNoteSelect = useCallback(
		(eventId: Id, select: boolean, clear: boolean) => {
			if (clear) {
				setSelected(selected.clear().set(eventId, select))
			} else {
				setSelected(selected.set(eventId, select))
			}
		},
		[selected],
	)

	return (
		<Panel
			id={id}
			color={isRecording ? 'red' : color}
			label={getNodeInfo().betterSequencer.typeName}
			className={oneLine`
				betterSequencer
				playing-${isPlaying}
				recording-${isRecording}
			`}
			saturate={isPlaying}
			extra={seqLengthValueToString(rate / 4 * lengthBeats)}
			helpText={stripIndents`
				Better Sequencer

				By the Better Beats Bureau

				It's better than you
			`}
		>
			<BetterSequencerControls {...{id}} />
			<div
				className="editor"
				ref={editorElement}
				tabIndex={-1}
			>
				<BetterRows {...{noteHeight, panPixelsY: panPixels.y}} />
				<BetterColumns {...{columnWidth, lengthBeats, panPixelsX: panPixels.x}} />
				<BetterNotes
					{...{
						id,
						noteHeight,
						columnWidth,
						midiClip,
						onNoteSelect,
						clearSelected,
						panPixels,
						selected,
						width,
						lengthBeats,
						zoomX: zoom.x,
					}}
				/>
				{boxActive && <BoxSelect
					origin={boxOrigin}
					otherCorner={otherCorner}
				/>}
			</div>
		</Panel>
	)
}
