import React, {
	useCallback, useState, useEffect,
	useRef, useLayoutEffect,
} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {
	globalClockActions,
	expNodesActions, expMidiPatternsActions,
	createExpPositionSelectedSelector,
} from '@corgifm/common/redux'
import {
	Key, MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0,
} from '@corgifm/common/common-constants'
import {clamp} from '@corgifm/common/common-utils'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {
	minPan, maxPan, minZoomX, maxZoomX, minZoomY,
	maxZoomY, smallestNoteLength, betterSideNotesWidth,
} from '@corgifm/common/BetterConstants'
import './BetterSequencer.less'
import {
	makeMouseMovementAccountForGlobalZoom,
} from '../../../SimpleGlobalClientState'
import {useBoolean, useExpPosition} from '../../../react-hooks'
import {logger} from '../../../client-logger'
import {BoxSelect} from './BoxSelect'
import {BetterRows} from './BetterRows'
import {BetterColumns} from './BetterColumns'
import {BetterNotes} from './BetterNotes'
import {
	clientSpaceToPercentages, getMaxPan, editorSpaceToPercentages,
	clientSpaceToEditorSpace, TimeSelect,
	editorOffsetSpaceToPercentages,
} from './BetterSequencerHelpers'
import {BetterSideNotes} from './BetterSideNotes'
import {useNodeContext} from '../../CorgiNode'
import {ExpBetterSequencerNode} from '../ExpBetterSequencerNode'
import {useNumberChangedEvent, useObjectChangedEvent, useStringChangedEvent} from '../../hooks/useCorgiEvent'
import {SeqEvents, makeNoteEvent2, duplicateNoteEvent} from '@corgifm/common/SeqStuff'
import {BetterLoopBar} from './BetterLoopBar'

const mouseWheelYSensitivity = 0.001
const mouseWheelPanXSensitivity = 0.001
const mouseWheelZoomXSensitivity = 0.01
const mouseWheelZoomYSensitivity = 0.01
const middleMousePanXSensitivity = 0.001
const middleMousePanYSensitivity = 0.001
const leftZoomSensitivity = 0.01

const rows = new Array(128).fill(0).map((_, i) => midiNoteToNoteNameFull(i))

export const ExpBetterSequencerInner = React.memo(function _ExpBetterSequencerInner() {
	const nodeContext = useNodeContext() as ExpBetterSequencerNode
	const isNodeSelected = useSelector(createExpPositionSelectedSelector(nodeContext.id))
	const position = useExpPosition(nodeContext.id)

	const {x, y, width} = position
	const height = 400

	const rate = useNumberChangedEvent(nodeContext.rate.onChange)
	const zoomX = useNumberChangedEvent(nodeContext.zoomX.onChange)
	const zoomY = useNumberChangedEvent(nodeContext.zoomY.onChange)
	const panX = useNumberChangedEvent(nodeContext.panX.onChange)
	const panY = useNumberChangedEvent(nodeContext.panY.onChange)

	const expMidiPatternView = useObjectChangedEvent(nodeContext.midiPatternParam.value)
	const expMidiPattern = expMidiPatternView.pattern

	const lengthBeats = expMidiPatternView.loopEndBeat

	const zoom = {x: zoomX, y: zoomY}
	const pan = {x: panX, y: panY}
	
	const [selected, setSelected] = useState(Set<Id>())
	const [originalSelected, setOriginalSelected] = useState(Set<Id>())
	const clearSelected = useCallback(() => setSelected(Set()), [])

	// Box Select
	const [boxActive, activateBox, deactivateBox] = useBoolean(false)
	const [boxOrigin, setBoxOrigin] = useState({x: 0, y: 0})
	const [otherCorner, setOtherCorner] = useState({x: 0, y: 0})

	// Timeline
	const [timeSelect, setTimeSelect] = useState<TimeSelect>({start: 0, duration: 0})

	// Middle mouse pan
	const [middleMouseActive, activateMiddleMouse, deactivateMiddleMouse] = useBoolean(false)

	// Left Zoom Pan Bar
	const [leftZoomPanActive, activateLeftZoomPan, deactivateLeftZoomPan] = useBoolean(false)

	// Common state
	const [persistentDelta, setPersistentDelta] = useState({x: 0, y: 0})
	const [startPoint, setStartPoint] = useState({x: 0, y: 0})
	const [firstMouseMove, setFirstMouseMove] = useState(false)

	const editorElement = useRef<HTMLDivElement>(null)

	const dispatch = useDispatch()

	const fixedHeight = 384
	const fixedWidth = 512

	const scaledHeightUnclamped = fixedHeight * zoom.y
	const scaledHeight = Math.max(scaledHeightUnclamped, height)
	const scaledWidthUnclamped = fixedWidth * zoom.x
	const scaledWidth = Math.max(scaledWidthUnclamped, width)

	const maxPanY = Math.max(scaledHeightUnclamped - height, 0)
	const maxPanX = getMaxPan(fixedWidth, zoom.x)
	const panPixels = {
		x: pan.x * maxPanX,
		y: pan.y * maxPanY,
	}

	const noteHeight = scaledHeight / rows.length

	const clientMousePositionToPercentages = useCallback((clientMousePosition: Point) => {
		return clientSpaceToPercentages(clientMousePosition, {x, y}, panPixels, maxPanX, maxPanY, fixedWidth, scaledHeight)
	}, [scaledHeight, maxPanX, maxPanY, panPixels, fixedWidth, x, y])

	const removeDuplicateEvents = useCallback(() => {
		const {toDelete} = expMidiPattern.events.reduce((result, event) => {
			if (result.clean.some(c => c.note === event.note && c.startBeat === event.startBeat && c.duration === event.duration)) {
				return {
					...result,
					toDelete: result.toDelete.add(event.id),
				}
			} else {
				return {
					...result,
					clean: result.clean.set(event.id, event),
				}
			}
		}, {clean: SeqEvents(), toDelete: Set<Id>()})

		dispatch(expMidiPatternsActions.deleteEvents(expMidiPattern.id, toDelete))
	}, [dispatch, expMidiPattern.events, expMidiPattern.id])

	// Wheel events
	useLayoutEffect(() => {
		const onWheel = (e: WheelEvent) => {

			// const bar = clientSpaceToPercentages({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

			let preventDefault = true

			if (e.shiftKey && !e.ctrlKey) {
				dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.panX.id,
					clamp(pan.x + (e.deltaY * (mouseWheelPanXSensitivity / zoom.x)), minPan, maxPan)
				))
			} else if (e.ctrlKey && e.altKey) {
				dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.zoomX.id,
					clamp(zoom.x + (-e.deltaY * mouseWheelZoomXSensitivity), minZoomX, maxZoomX)
				))
			} else if (e.altKey) {
				dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.zoomY.id,
					clamp(zoom.y + (-e.deltaY * mouseWheelZoomYSensitivity), minZoomY, maxZoomY)
				))
				// dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.).setPan(id, {
				// 	...pan,
				// 	y: clamp(bar.centerY, minPan, maxPan),
				// }))
			} else if (e.ctrlKey && e.shiftKey) {
				dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.panY.id,
					clamp(pan.y + (e.deltaY * (mouseWheelYSensitivity / zoom.y)), minPan, maxPan)
				))
			} else {
				preventDefault = false
			}

			if (preventDefault) {
				e.preventDefault()
				e.stopPropagation()
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
	}, [dispatch, nodeContext.id, pan, zoom])

	// Double click events
	useEffect(() => {
		const editorElementNotNull = editorElement.current

		if (editorElementNotNull === null) return

		const onDoubleClick = (e: MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			const bar = editorOffsetSpaceToPercentages({x: e.offsetX, y: e.offsetY}, scaledWidthUnclamped, scaledHeight)

			const newDuration = 1
			const note = clamp((rows.length - 1) - Math.floor(bar.y * rows.length), MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127)
			const startBeat = clamp(Math.floor(bar.x * lengthBeats), 0, lengthBeats - newDuration)

			const newEvent = makeNoteEvent2(note, startBeat, newDuration)

			dispatch(expMidiPatternsActions.addEvent(expMidiPattern.id, newEvent))
			// TODO
			// dispatch(localActions.playShortNote(id, Set([note])))
			setSelected(Set(newEvent.id))
			removeDuplicateEvents()
		}

		if (editorElementNotNull) {
			editorElementNotNull.addEventListener('dblclick', onDoubleClick)
		}

		return () => {
			if (editorElementNotNull) {
				editorElementNotNull.removeEventListener('dblclick', onDoubleClick)
			}
		}
	}, [dispatch, lengthBeats, removeDuplicateEvents, scaledHeight, scaledWidthUnclamped, expMidiPattern.id])

	// Box Select
	useLayoutEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0 || (e.ctrlKey && e.altKey)) return
			const editorSpace = clientSpaceToEditorSpace(
				{x: e.clientX, y: e.clientY}, {x, y})
			setBoxOrigin(editorSpace)
			setOtherCorner(editorSpace)
			if (e.shiftKey) {
				setOriginalSelected(selected)
			} else {
				setOriginalSelected(Set())
				clearSelected()
			}
			activateBox()
		}

		const onMouseUp = (e: MouseEvent) => {
			if (e.button !== 0) return
			if (boxActive) {
				deactivateBox()
				selectNotes(undefined, e.shiftKey, e)
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
			selectNotes(clamped, e.shiftKey, e)
		}

		function selectNotes(otherCorner2 = otherCorner, preserve = false, e: MouseEvent) {
			const originPercentages = editorSpaceToPercentages(boxOrigin, panPixels, maxPanX, maxPanY, fixedWidth, scaledHeight)
			const otherCornerPercentages = editorSpaceToPercentages(otherCorner2, panPixels, maxPanX, maxPanY, fixedWidth, scaledHeight)
			const box = {
				top: (rows.length - 1) - Math.floor(Math.min(originPercentages.y, otherCornerPercentages.y) * rows.length),
				bottom: (rows.length - 1) - Math.floor(Math.max(originPercentages.y, otherCornerPercentages.y) * rows.length),
				left: Math.min(originPercentages.x, otherCornerPercentages.x) * lengthBeats,
				right: Math.max(originPercentages.x, otherCornerPercentages.x) * lengthBeats,
			}

			const insideBox = expMidiPattern.events.filter(
				z => z.note <= box.top &&
					z.note >= box.bottom &&
					(z.startBeat + z.duration) >= box.left &&
					z.startBeat <= box.right
			).keySeq().toSet()

			const toFlip = preserve
				? insideBox.filter(i => originalSelected.has(i))
				: Set()

			setSelected(
				insideBox
					.concat(preserve ? originalSelected : [])
					.filter(i => !toFlip.has(i))
			)

			setTimeSelect({
				start: clamp(e.altKey ? box.left : Math.round(box.left), 0, lengthBeats),
				duration: box.right - box.left,
			})
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
	}, [activateBox, boxActive, boxOrigin, deactivateBox, height, lengthBeats,
		maxPanX, maxPanY, expMidiPattern.events, otherCorner, panPixels, width,
		x, y, selected, originalSelected, scaledHeight, clearSelected])

	// Middle mouse pan
	useLayoutEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (e.button === 0 && e.ctrlKey && e.altKey) {
				activateMiddleMouse()
			}
		}

		const onMouseUp = (e: MouseEvent) => {
			if (e.button === 0 && e.ctrlKey && e.altKey) {
				deactivateMiddleMouse()
			}
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1 || !e.ctrlKey || !e.altKey) return deactivateMiddleMouse()

			const zoomedMovement = makeMouseMovementAccountForGlobalZoom(
				{x: e.movementX, y: e.movementY})

			dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.panX.id,
				zoom.x === 1
					? pan.x
					: clamp(
						pan.x + ((-zoomedMovement.x) * (1 / (fixedWidth * (zoom.x - 1)))),
						minPan, maxPan)
			))

			dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.panY.id,
				zoom.y === 1
					? pan.y
					: clamp(
						pan.y + -zoomedMovement.y / maxPanY,
						minPan, maxPan)
			))
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
	}, [activateMiddleMouse, deactivateMiddleMouse, dispatch, nodeContext.id, maxPanY, middleMouseActive, pan, zoom])

	// Left Zoom Pan Bar
	const onLeftZoomPanBarMouseDown = useCallback((e: React.MouseEvent) => {
		if (e.button === 0) {
			activateLeftZoomPan()
			setPersistentDelta({x: 0, y: 0})
			setFirstMouseMove(false)
		}
	}, [activateLeftZoomPan])

	useLayoutEffect(() => {
		if (!leftZoomPanActive) return

		const onMouseUp = (e: MouseEvent) => {
			if (e.button === 0) {
				deactivateLeftZoomPan()
			}
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return deactivateLeftZoomPan()

			if (!firstMouseMove) {
				setFirstMouseMove(true)
				return setStartPoint({x: pan.y, y: zoom.y})
			}

			const newPersistentDelta = {x: persistentDelta.x + e.movementX, y: persistentDelta.y + e.movementY}

			const zoomedMovement = makeMouseMovementAccountForGlobalZoom(newPersistentDelta)

			const newZoomY = clamp(
				startPoint.y + (newPersistentDelta.x * leftZoomSensitivity),
				minZoomY,
				maxZoomY)

			const newPanY = zoom.y === 1
					? pan.y
					: clamp(
						startPoint.x + -zoomedMovement.y / maxPanY,
						minPan, maxPan)

			dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.zoomY.id, newZoomY))
			dispatch(expNodesActions.customNumberParamChange(nodeContext.id, nodeContext.panY.id, newPanY))

			setPersistentDelta(newPersistentDelta)
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [activateLeftZoomPan, deactivateLeftZoomPan, dispatch, maxPanY, nodeContext,
		leftZoomPanActive, pan, zoom, persistentDelta, firstMouseMove, startPoint])

	const columnWidth = (fixedWidth * zoom.x) / lengthBeats

	const selectAll = useCallback(() => {
		setSelected(expMidiPattern.events.keySeq().toSet())
	}, [setSelected, expMidiPattern.events])

	const duplicateNotes = useCallback(() => {
		const eventsToCopy = expMidiPattern.events
			.filter(event => selected.has(event.id))

		const smallX = eventsToCopy.map(e => e.startBeat).min() || 0
		const bigX = eventsToCopy.map(e => e.startBeat + e.duration).max() || 0
		const diff = bigX - smallX

		if (diff === 0) return

		const newEvents = eventsToCopy
			.reduce((result, event) => {
				const newEvent = duplicateNoteEvent({
					...event,
					startBeat: event.startBeat + diff,
				})
				return result.set(newEvent.id, newEvent)
			}, SeqEvents())
		dispatch(expMidiPatternsActions.addEvents(expMidiPattern.id, newEvents))
		setSelected(newEvents.keySeq().toSet())
	}, [expMidiPattern.events, dispatch, nodeContext.id, selected, expMidiPattern.id])

	const deleteSelected = useCallback(() => {
		dispatch(expMidiPatternsActions.deleteEvents(expMidiPattern.id, selected))
		setSelected(Set())
	}, [dispatch, selected, setSelected, expMidiPattern.id])

	const moveNotesVertically = useCallback((direction: 1 | -1, shift: boolean) => {
		const updatedEvents = selected.reduce((events, eventId) => {
			const originalEvent = expMidiPattern.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[moveNotesVertically] originalEvent === null')
				return events
			}

			const delta = (shift ? 12 : 1) * direction

			return events.set(eventId, {
				...originalEvent,
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, originalEvent.note + delta)),
			})
		}, SeqEvents())

		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, updatedEvents))
		// TODO
		// dispatch(localActions.playShortNote(id, updatedEvents.map(eventToNote).toSet()))
	}, [dispatch, expMidiPattern.id, selected, expMidiPattern.events])

	const moveNotesHorizontally = useCallback((direction: 1 | -1, alt: boolean) => {
		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, selected.reduce((events, eventId) => {
			const originalEvent = expMidiPattern.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[moveNotesHorizontally] originalEvent === null')
				return events
			}

			const delta = (alt ? smallestNoteLength : 1) * direction

			return events.set(eventId, {
				...originalEvent,
				startBeat: Math.max(0, Math.min(lengthBeats - 1, originalEvent.startBeat + delta)),
			})
		}, SeqEvents())))
	}, [dispatch, expMidiPattern.id, selected, expMidiPattern.events, lengthBeats])

	const resizeNotes = useCallback((direction: 1 | -1, alt: boolean) => {
		dispatch(expMidiPatternsActions.updateEvents(expMidiPattern.id, selected.reduce((events, eventId) => {
			const originalEvent = expMidiPattern.events.get(eventId, null)

			if (originalEvent === null) {
				logger.warn('[resizeNotes] originalEvent === null')
				return events
			}

			const delta = (alt ? smallestNoteLength : 1) * direction

			if (direction === 1 && originalEvent.duration === smallestNoteLength && !alt) {
				return events.set(eventId, {
					...originalEvent,
					duration: 1,
				})
			} else {
				return events.set(eventId, {
					...originalEvent,
					duration: Math.max(smallestNoteLength, Math.min(8, originalEvent.duration + delta)),
				})
			}
		}, SeqEvents())))
	}, [dispatch, expMidiPattern.id, selected, expMidiPattern.events])

	const onKeyDown = useCallback((e: KeyboardEvent) => {

		if (e.ctrlKey && e.key === ' ') {
			dispatch(globalClockActions.restart(timeSelect.start * rate))
		}

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

		if (e.key === Key.Delete || e.key === Key.Backspace) {
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
	}, [dispatch, timeSelect.start, rate, selectAll, duplicateNotes,
		selected, deleteSelected, moveNotesVertically, resizeNotes, moveNotesHorizontally])

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
			const foo = clear ? Set() : selected
			if (select) {
				setSelected(foo.add(eventId))
			} else {
				setSelected(foo.remove(eventId))
			}
		},
		[selected],
	)

	const color = useStringChangedEvent(nodeContext.onColorChange)

	return (
		<div className="expBetterSequencer" style={{color, height}}>
			<div className="top">
				<div className="topLeft" style={{width: betterSideNotesWidth}}></div>
				<BetterLoopBar {...{width, columnWidth}} />
			</div>
			<div className="middle">
				<BetterSideNotes {...{rows, panPixelsY: panPixels.y, noteHeight, onLeftZoomPanBarMouseDown}} />
				<div
					className="editor"
					ref={editorElement}
					tabIndex={-1}
				>
					<div
						className="translatable"
						style={{
							transform: `translate(${-panPixels.x}px, ${-panPixels.y}px)`,
							width: scaledWidth + panPixels.x,
							height: scaledHeight,
						}}
					>
						<BetterRows {...{noteHeight, rows}} />
						<BetterColumns {...{columnWidth, lengthBeats, timeSelect}} />
						<BetterNotes
							{...{
								noteHeight,
								columnWidth,
								expMidiPattern,
								onNoteSelect,
								clearSelected,
								panPixels,
								selected,
								setSelected,
								width,
								height,
								lengthBeats,
								zoom,
								rows,
								clientMousePositionToPercentages,
								removeDuplicateEvents,
							}}
						/>
					</div>
					{boxActive && <BoxSelect
						origin={boxOrigin}
						otherCorner={otherCorner}
						top={scaledHeight}
					/>}
				</div>
			</div>
			<div className="bottom">

			</div>
		</div>
	)
})
