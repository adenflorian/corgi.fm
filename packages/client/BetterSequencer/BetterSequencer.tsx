import React, {useCallback, useState, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Map, OrderedMap} from 'immutable'
import {stripIndents, oneLine} from 'common-tags'
import {
	createPositionColorSelector, createBetterSeqIsRecordingSelector,
	createBetterSeqIsPlayingSelector, createBetterSeqRateSelector, getNodeInfo,
	createBetterSeqLengthSelector, createBetterSeqZoomSelector,
	createBetterSeqMidiClipSelector, createBetterSeqPanSelector,
	createPositionHeightSelector, createPositionWidthSelector, sequencerActions, betterSequencerActions,
} from '@corgifm/common/redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {Key, MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '@corgifm/common/common-constants'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {Panel} from '../Panel/Panel'
import {seqLengthValueToString} from '../client-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {Knob} from '../Knob/Knob'
import './BetterSequencer.less'

interface Props {
	id: Id
}

const rows = new Array(128).fill(0)

const controlsWidth = 64

export const BetterSequencer = ({id}: Props) => {
	const color = useSelector(createPositionColorSelector(id))
	const isRecording = useSelector(createBetterSeqIsRecordingSelector(id))
	const isPlaying = useSelector(createBetterSeqIsPlayingSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))
	const length = useSelector(createBetterSeqLengthSelector(id))
	const zoom = useSelector(createBetterSeqZoomSelector(id))
	const pan = useSelector(createBetterSeqPanSelector(id))
	const midiClip = useSelector(createBetterSeqMidiClipSelector(id))
	const height = useSelector(createPositionHeightSelector(id))
	const width = useSelector(createPositionWidthSelector(id)) - controlsWidth
	const isNodeSelected = useSelector(createPositionHeightSelector(id))

	const scaledHeight = height * zoom.y

	const panYOffset = (scaledHeight - height) / 2

	const maxPanY = getMaxPanY(height, zoom.y)

	const noteHeight = scaledHeight / 128

	const dispatch = useDispatch()

	const setZoomX = useCallback((_, newZoomX: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, x: newZoomX}))
	}, [dispatch, id, zoom])

	const setZoomY = useCallback((_, newZoomY: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, y: newZoomY}))
		const foo = Math.min(getMaxPanY(height, newZoomY), pan.y)
		dispatch(sequencerActions.setPan(id, {...pan, y: foo}))
	}, [dispatch, id, zoom, height, pan])

	const setPanX = useCallback((_, newPanX: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, x: newPanX}))
	}, [dispatch, id, pan])

	const setPanY = useCallback((_, newPanY: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, y: newPanY}))
	}, [dispatch, id, pan])

	const [selected, setSelected] = useState(Map<Id, boolean>())

	const clearSelected = () => setSelected(Map())

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
					min={1}
					max={10}
					onChange={setZoomX}
					tooltip={`zoom x`}
					value={zoom.x}
				/>
				<Knob
					defaultValue={1}
					label={`Zoom Y`}
					min={1}
					max={10}
					onChange={setZoomY}
					tooltip={`zoom Y`}
					value={zoom.y}
				/>
				<Knob
					defaultValue={1}
					label={`Pan X`}
					min={0}
					max={1}
					onChange={setPanX}
					tooltip={`pan x`}
					value={pan.x}
				/>
				<Knob
					defaultValue={1}
					label={`Pan Y`}
					min={0}
					max={maxPanY}
					onChange={setPanY}
					tooltip={`pan Y`}
					value={pan.y}
				/>
			</div>
			<div
				className="editor"
			>
				<div
					className="rows"
				>
					<div
						className="scalable"
						style={{
							transform: `translateY(${-pan.y + panYOffset}px) scaleY(${zoom.y})`,
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
										dispatch(betterSequencerActions.deleteEvents(id, [event.id]))
									}}
									style={{
										width: event.durationBeats * columnWidth,
										height: noteHeight - 1,
										left: event.startBeat * columnWidth,
										top: ((128 - event.note) * noteHeight) - noteHeight - pan.y,
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

function getMaxPanY(height: number, zoomY: number) {

	const scalableHeight = height * zoomY

	const maxPanY = scalableHeight - height

	return maxPanY
}
