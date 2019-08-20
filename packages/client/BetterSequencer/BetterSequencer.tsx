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
import {MidiClipEvent, makeMidiClipEvent} from '@corgifm/common/midi-types'
import {Panel} from '../Panel/Panel'
import {
	seqLengthValueToString, percentageValueString,
} from '../client-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {Knob} from '../Knob/Knob'
import './BetterSequencer.less'
import {
	mouseFromScreenToBoard, makeMouseMovementAccountForGlobalZoom,
} from '../SimpleGlobalClientState'
import {useBoolean} from '../react-hooks'
import {BoxSelect} from './BoxSelect'
import {BetterNote} from './BetterNote'

interface Props {
	id: Id
}

const smallestNoteLength = 1 / 64

const rows = new Array(128).fill(0)

const controlsWidth = 64

const mouseWheelYSensitivity = 0.001
const mouseWheelPanXSensitivity = 0.001
const mouseWheelZoomXSensitivity = 0.01
const mouseWheelZoomYSensitivity = 0.01
const middleMousePanXSensitivity = 0.001
const middleMousePanYSensitivity = 0.001

const minZoomX = 1
const maxZoomX = 20
const minZoomY = 1
const maxZoomY = 10
const minPan = 0
const maxPan = 1

export const BetterSequencer = ({id}: Props) => {
	const color = useSelector(createPositionColorSelector(id))
	const isRecording = useSelector(createBetterSeqIsRecordingSelector(id))
	const isPlaying = useSelector(createBetterSeqIsPlayingSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))
	const length = useSelector(createBetterSeqLengthSelector(id))
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

	const nodeInfo = getNodeInfo().betterSequencer

	const editorElement = useRef<HTMLDivElement>(null)

	const scaledHeight = height * zoom.y

	const panYOffset = (scaledHeight - height) / 2

	const maxPanY = getMaxPan(height, zoom.y)
	const maxPanX = getMaxPan(width, zoom.x)
	const panPixels = {
		x: pan.x * maxPanX,
		y: pan.y * maxPanY,
	}

	const noteHeight = scaledHeight / 128

	const dispatch = useDispatch()

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
			if (e.target && typeof (e.target as HTMLElement).className === 'string' && (e.target as HTMLElement).className.startsWith('note')) {
				return
			}
			e.preventDefault()
			e.stopPropagation()

			const bar = clientSpaceToPercentages({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

			const note = 127 - Math.floor(bar.y * 128)
			const startBeat = Math.floor(bar.x * length)

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
	}, [dispatch, height, id, length, maxPanX, maxPanY, panPixels, selected, width, x, y])

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
			deactivateBox()
			selectNotes(undefined, e.shiftKey)
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
				left: Math.min(originPercentages.x, otherCornerPercentages.x) * length,
				right: Math.max(originPercentages.x, otherCornerPercentages.x) * length,
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
	}, [activateBox, boxActive, boxOrigin, deactivateBox, height, length, maxPanX, maxPanY, midiClip.events, otherCorner, panPixels, width, x, y, selected])

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

	const setZoomX = useCallback((_, newZoomX: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, x: newZoomX}))
	}, [dispatch, id, zoom])

	const setZoomY = useCallback((_, newZoomY: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, y: newZoomY}))
	}, [dispatch, id, zoom])

	const setPanX = useCallback((_, newPanX: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, x: newPanX}))
	}, [dispatch, id, pan])

	const setPanY = useCallback((_, newPanY: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, y: newPanY}))
	}, [dispatch, id, pan])

	const columns = new Array(length).fill(0)

	const columnWidth = (width * zoom.x) / length

	// Key events
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {

			if (e.ctrlKey && e.key === Key.a) {
				return setSelected(midiClip.events.map(_ => true))
			}

			if (e.key === Key.Delete) {
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.deleteEvents(id, selected.keySeq()))
				return setSelected(Map())
			}

			if (e.key === Key.ArrowUp) {
				e.preventDefault()
				if (selected.count() === 0) return

				const updatedEvents = selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.shiftKey
						? 12
						: 1
					return events.set(eventId, {
						...originalEvent,
						note: Math.min(MAX_MIDI_NOTE_NUMBER_127, originalEvent.note + delta),
					})
				}, OrderedMap<Id, MidiClipEvent>())

				dispatch(betterSequencerActions.updateEvents(id, updatedEvents))
				dispatch(localActions.playShortNote(id, updatedEvents.map(eventToNote).toSet()))
				return
			}
			if (e.key === Key.ArrowDown) {
				e.preventDefault()
				if (selected.count() === 0) return

				const updatedEvents = selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.shiftKey
						? 12
						: 1
					return events.set(eventId, {
						...originalEvent,
						note: Math.max(MIN_MIDI_NOTE_NUMBER_0, originalEvent.note - delta),
					})
				}, OrderedMap<Id, MidiClipEvent>())

				dispatch(betterSequencerActions.updateEvents(id, updatedEvents))
				dispatch(localActions.playShortNote(id, updatedEvents.map(eventToNote).toSet()))
				return
			}
			if (e.key === Key.ArrowRight) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.altKey
						? smallestNoteLength
						: 1
					if (e.shiftKey) {
						if (originalEvent.durationBeats === smallestNoteLength && !e.altKey) {
							return events.set(eventId, {
								...originalEvent,
								durationBeats: 1,
							})
						} else {
							return events.set(eventId, {
								...originalEvent,
								durationBeats: Math.min(8, originalEvent.durationBeats + delta),
							})
						}
					} else {
						return events.set(eventId, {
							...originalEvent,
							startBeat: Math.min(length - 1, originalEvent.startBeat + delta),
						})
					}
				}, OrderedMap<Id, MidiClipEvent>())))
				return
			}
			if (e.key === Key.ArrowLeft) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.altKey
						? smallestNoteLength
						: 1
					if (e.shiftKey) {
						return events.set(eventId, {
							...originalEvent,
							durationBeats: Math.max(smallestNoteLength, originalEvent.durationBeats - delta),
						})
					} else {
						return events.set(eventId, {
							...originalEvent,
							startBeat: Math.max(0, originalEvent.startBeat - delta),
						})
					}
				}, OrderedMap<Id, MidiClipEvent>())))
				return
			}
		}

		if (isNodeSelected) {
			window.addEventListener('keydown', onKeyDown)
		}

		return () => {
			window.removeEventListener('keydown', onKeyDown)
		}
	}, [dispatch, id, isNodeSelected, length, midiClip.events, selected])

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
			extra={seqLengthValueToString(rate / 4 * length)}
			helpText={stripIndents`
				Better Sequencer

				It's better than you
			`}
		>
			<div className="controls">
				<Knob
					defaultValue={1}
					label={`Zoom X`}
					min={minZoomX}
					max={maxZoomX}
					onChange={setZoomX}
					tooltip={`zoom x`}
					value={zoom.x}
				/>
				<Knob
					defaultValue={1}
					label={`Zoom Y`}
					min={minZoomY}
					max={maxZoomY}
					onChange={setZoomY}
					tooltip={`zoom Y`}
					value={zoom.y}
				/>
				<Knob
					defaultValue={1}
					label={`Pan X`}
					min={minPan}
					max={maxPan}
					onChange={setPanX}
					tooltip={`pan x`}
					value={pan.x}
					valueString={percentageValueString}
				/>
				<Knob
					defaultValue={1}
					label={`Pan Y`}
					min={minPan}
					max={maxPan}
					onChange={setPanY}
					tooltip={`pan Y`}
					value={pan.y}
					valueString={percentageValueString}
				/>
			</div>
			<div
				className="editor"
				ref={editorElement}
			>
				<div className="rows">
					<div
						className="scalable"
						style={{
							transform: `translateY(${-panPixels.y}px)`,
						}}
					>
						{rows.map((_, note) => {
							return (
								<div
									key={note}
									className={`row note-${note}`}
									style={{
										backgroundColor: isWhiteKey(note) ? '#4444' : '#0000',
										height: noteHeight,
									}}
								/>
							)
						})}
					</div>
				</div>
				<div className="columns">
					<div
						className="scalable"
						style={{
							transform: `translateX(${-panPixels.x}px)`,
						}}
					>
						{columns.map((_, beat) => {
							return (
								<div
									key={beat}
									className={`column beat-${beat}`}
									style={{
										width: columnWidth,
										// backgroundColor: note % 4 === 0 ? '#0000' : '#3333',
									}}
								>
									<div
										className="line"
										style={{
											// backgroundColor: '#3333',
										}}
									/>
								</div>
							)
						})}
					</div>
				</div>
				<div
					className="notes"
				>
					<div
						className="scalable"
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
									}}
								/>
							)
						}).toList()}
					</div>
				</div>
				{boxActive && <BoxSelect
					origin={boxOrigin}
					otherCorner={otherCorner}
				/>}
			</div>
		</Panel>
	)
}

function getMaxPan(length: number, zoom: number) {
	return (length * zoom) - length
}

function clientSpaceToPercentages(
	clientSpace: Point, nodePosition: Point, panPixels: Point, maxPanX: number,
	maxPanY: number, width: number, height: number,
) {
	const editorSpace = clientSpaceToEditorSpace(clientSpace, nodePosition)

	return editorSpaceToPercentages(
		editorSpace, panPixels, maxPanX, maxPanY, width, height)
}

function editorSpaceToPercentages(
	editorSpace: Point, panPixels: Point, maxPanX: number, maxPanY: number,
	width: number, height: number,
): Point {
	const panSpace = {
		x: (editorSpace.x + panPixels.x) / (maxPanX + width),
		y: (editorSpace.y + panPixels.y) / (maxPanY + height),
		centerY: (height / 2 + panPixels.y) / (maxPanY + height),
	}

	return panSpace
}

function clientSpaceToEditorSpace(
	clientSpace: Point, nodePosition: Point,
) {

	const boardSpace = mouseFromScreenToBoard(clientSpace)

	const nodeSpace = {
		x: boardSpace.x - nodePosition.x,
		y: boardSpace.y - nodePosition.y,
	}

	const nodeInfo = getNodeInfo().betterSequencer

	const editorSpace = {
		x: nodeSpace.x - nodeInfo.notesDisplayStartX,
		y: nodeSpace.y,
	}

	return editorSpace
}

const eventToNote = (event: MidiClipEvent) => event.note
