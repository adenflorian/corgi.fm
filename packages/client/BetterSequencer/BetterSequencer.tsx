import React, {useCallback, useState, useEffect, useRef} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Map, OrderedMap} from 'immutable'
import {stripIndents, oneLine} from 'common-tags'
import {
	createPositionColorSelector, createBetterSeqIsRecordingSelector,
	createBetterSeqIsPlayingSelector, createBetterSeqRateSelector, getNodeInfo,
	createBetterSeqLengthSelector, createBetterSeqZoomSelector,
	createBetterSeqMidiClipSelector, createBetterSeqPanSelector,
	createPositionHeightSelector, createPositionWidthSelector, sequencerActions, betterSequencerActions, createPositionXSelector, createPositionYSelector,
} from '@corgifm/common/redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {Key, MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0, panelHeaderHeight} from '@corgifm/common/common-constants'
import {clamp} from '@corgifm/common/common-utils'
import {MidiClipEvent, makeMidiClipEvent} from '@corgifm/common/midi-types'
import {Panel} from '../Panel/Panel'
import {seqLengthValueToString, percentageValueString} from '../client-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {Knob} from '../Knob/Knob'
import './BetterSequencer.less'
import {mouseFromScreenToBoard} from '../SimpleGlobalClientState'

interface Props {
	id: Id
}

const rows = new Array(128).fill(0)

const controlsWidth = 64

const mouseWheelYSensitivity = 0.001
const mouseWheelPanXSensitivity = 0.001
const mouseWheelZoomXSensitivity = 0.01
const mouseWheelZoomYSensitivity = 0.01

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

	useEffect(() => {
		const onWheel = (e: WheelEvent) => {
			if (e.altKey) return

			e.preventDefault()
			e.stopPropagation()

			const bar = mousePositionFromClientSpaceToEditorSpace({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

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

	useEffect(() => {
		const onDoubleClick = (e: MouseEvent) => {
			if (e.target && typeof (e.target as HTMLElement).className === 'string' && (e.target as HTMLElement).className.startsWith('note')) {
				return
			}
			e.preventDefault()
			e.stopPropagation()

			const bar = mousePositionFromClientSpaceToEditorSpace({x: e.clientX, y: e.clientY}, {x, y}, panPixels, maxPanX, maxPanY, width, height)

			const note = 127 - Math.floor(bar.y * 128)
			const startBeat = Math.floor(bar.x * length)

			const newEvent = makeMidiClipEvent({
				durationBeats: 1,
				startBeat,
				note,
			})

			dispatch(betterSequencerActions.addEvent(id, newEvent))
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

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {

			if (e.key === Key.Delete) {
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.deleteEvents(id, selected.keySeq()))
				setSelected(Map())
			}

			if (e.key === Key.ArrowUp) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.shiftKey
						? 12
						: 1
					return events.set(eventId, {
						...originalEvent,
						note: Math.min(MAX_MIDI_NOTE_NUMBER_127, originalEvent.note + delta),
					})
				}, OrderedMap<Id, MidiClipEvent>())))
			}
			if (e.key === Key.ArrowDown) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.shiftKey
						? 12
						: 1
					return events.set(eventId, {
						...originalEvent,
						note: Math.max(MIN_MIDI_NOTE_NUMBER_0, originalEvent.note - delta),
					})
				}, OrderedMap<Id, MidiClipEvent>())))
			}
			if (e.key === Key.ArrowRight) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.altKey
						? 0.1
						: 1
					if (e.shiftKey) {
						return events.set(eventId, {
							...originalEvent,
							durationBeats: Math.min(8, originalEvent.durationBeats + delta),
						})
					} else {
						return events.set(eventId, {
							...originalEvent,
							startBeat: Math.min(length - 1, originalEvent.startBeat + delta),
						})
					}
				}, OrderedMap<Id, MidiClipEvent>())))
			}
			if (e.key === Key.ArrowLeft) {
				e.preventDefault()
				if (selected.count() === 0) return

				dispatch(betterSequencerActions.updateEvents(id, selected.reduce((events, _, eventId) => {
					const originalEvent = midiClip.events.get(eventId, null)
					if (originalEvent === null) throw new Error('originalEvent === null')
					const delta = e.altKey
						? 0.1
						: 1
					if (e.shiftKey) {
						return events.set(eventId, {
							...originalEvent,
							durationBeats: Math.max(1 / 16, originalEvent.durationBeats - delta),
						})
					} else {
						return events.set(eventId, {
							...originalEvent,
							startBeat: Math.max(0, originalEvent.startBeat - delta),
						})
					}
				}, OrderedMap<Id, MidiClipEvent>())))
			}
		}

		if (isNodeSelected) {
			window.addEventListener('keydown', onKeyDown)
		}

		return () => {
			window.removeEventListener('keydown', onKeyDown)
		}
	}, [dispatch, id, isNodeSelected, length, midiClip.events, selected])

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
				<div
					className="rows"
				>
					<div
						className="scalable"
						style={{
							transform: `translateY(${-panPixels.y + panYOffset}px) scaleY(${zoom.y})`,
						}}
					>
						{rows.map((_, note) => {
							return (
								<div
									key={note}
									className={`row note-${note}`}
									style={{
										backgroundColor: isWhiteKey(note) ? '#4444' : '#0000',
									}}
								/>
							)
						})}
					</div>
				</div>
				<div
					className="columns"
				>
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
							clearSelected()
						}}
					>
						{midiClip.events.map(event => {
							const noteLabel = midiNoteToNoteNameFull(event.note)
							const isSelected = selected.get(event.id) || false
							return (
								<div
									key={event.id.toString()}
									// Class must start with `note`
									className={`note selected-${isSelected}`}
									title={noteLabel}
									onMouseDown={e => {
										e.stopPropagation()
										if (e.shiftKey) {
											setSelected(selected.set(event.id, !isSelected))
										} else {
											setSelected(selected.clear().set(event.id, true))
										}
									}}
									onDoubleClick={e => {
										e.preventDefault()
										e.stopPropagation()
										dispatch(betterSequencerActions.deleteEvents(id, [event.id]))
									}}
									style={{
										width: event.durationBeats * columnWidth,
										height: noteHeight - 1,
										left: event.startBeat * columnWidth - panPixels.x,
										top: ((128 - event.note) * noteHeight) - noteHeight - panPixels.y,
										// backgroundColor: note % 4 === 0 ? '#0000' : '#3333',
									}}
								>
									<div
										className="noteLabel"
										style={{
											fontSize: Math.min(16, noteHeight - 14.5),
										}}
									>
										{noteLabel}
									</div>
								</div>
							)
						}).toList()}
					</div>
				</div>
			</div>
		</Panel>
	)
}

function getMaxPan(length: number, zoom: number) {
	return (length * zoom) - length
}

function mousePositionFromClientSpaceToEditorSpace(
	clientSpace: Point, nodePosition: Point, panPixels: Point, maxPanX: number, maxPanY: number, width: number, height: number,
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

	const panSpace = {
		x: (editorSpace.x + panPixels.x) / (maxPanX + width),
		y: (editorSpace.y + panPixels.y) / (maxPanY + height),
		centerY: (height / 2 + panPixels.y) / (maxPanY + height),
	}

	// console.log(JSON.stringify({editorSpace, panSpace, maxPanY}))

	return panSpace
}
