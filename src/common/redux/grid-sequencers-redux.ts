import {List, Map, Stack} from 'immutable'
import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ConnectionNodeType, makeMidiClip, MidiClip, MidiClipEvents} from '../common-types'
import {emptyMidiNotes, IMidiNote} from '../MidiNote'
import {MAX_MIDI_NOTE_NUMBER_127} from '../server-constants'
import {colorFunc, hashbow} from '../shamu-color'
import {addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents, IClientRoomState, IMultiState, IMultiStateThings, isEmptyEvents, ISequencerState, makeMultiReducer, NetworkActionType, PLAY_ALL, selectAllInfiniteSequencers, selectGlobalClockState, SERVER_ACTION, STOP_ALL, UNDO_SEQUENCER} from './index'
import {NodeSpecialState} from './shamu-graph'

export const addGridSequencer = (gridSequencer: IGridSequencerState) =>
	addMultiThing(gridSequencer, ConnectionNodeType.gridSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_GRID_SEQUENCER_NOTE = 'SET_GRID_SEQUENCER_NOTE'
export const setGridSequencerNote =
	(gridSequencerId: string, index: number, enabled: boolean, note: IMidiNote) => {
		return {
			type: SET_GRID_SEQUENCER_NOTE,
			id: gridSequencerId,
			index,
			enabled,
			note,
			SERVER_ACTION,
			BROADCASTER_ACTION,
		}
	}

export const RESTART_GRID_SEQUENCER = 'RESTART_GRID_SEQUENCER'
export const restartGridSequencer = (id: string) => ({
	type: RESTART_GRID_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const EXPORT_SEQUENCER_MIDI = 'EXPORT_SEQUENCER_MIDI'
export type ExportSequencerMidiAction = ReturnType<typeof exportSequencerMidi>
export const exportSequencerMidi = (sequencerId: string) => ({
	type: EXPORT_SEQUENCER_MIDI,
	sequencerId,
})

export const SET_GRID_SEQUENCER_FIELD = 'SET_GRID_SEQUENCER_FIELD'
export type SetGridSequencerField = ReturnType<typeof setGridSequencerField>
export const setGridSequencerField = (id: string, fieldName: GridSequencerFields, data: any) => ({
	type: SET_GRID_SEQUENCER_FIELD,
	id,
	fieldName,
	data,
	...getNetworkActionThings(fieldName),
})

function getNetworkActionThings(fieldName: GridSequencerFields) {
	if ([
		GridSequencerFields.isPlaying,
		GridSequencerFields.scrollY,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum GridSequencerFields {
	isPlaying = 'isPlaying',
	scrollY = 'scrollY',
	index = 'index',
}

export interface IGridSequencersState extends IMultiState {
	things: IGridSequencers
}

export interface IGridSequencers extends IMultiStateThings {
	[key: string]: IGridSequencerState
}

export interface IGridSequencerState extends ISequencerState {
	scrollY: number
	notesToShow: number
}

export class GridSequencerState implements IGridSequencerState, NodeSpecialState {
	public static defaultWidth = 520
	public static defaultHeight = 234
	public static noteWidth = 12
	public static scrollBarWidth = 16
	public static noteHeight = 8
	public static controlSize = 40

	public static dummy: IGridSequencerState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		index: -1,
		isPlaying: false,
		color: 'gray',
		name: 'dummy',
		scrollY: 0,
		notesToShow: 0,
		isRecording: false,
		previousEvents: List<MidiClipEvents>(),
		width: GridSequencerState.defaultWidth,
		height: GridSequencerState.defaultHeight,
		type: ConnectionNodeType.gridSequencer,
		rate: 1,
		midiClip: makeMidiClip({
			events: List(),
			length: 0,
			loop: false,
		}),
	}

	public readonly id: string = uuid.v4()
	public readonly ownerId: string
	public readonly midiClip: MidiClip
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly scrollY: number
	public readonly notesToShow: number
	public readonly isRecording: boolean = false
	public readonly previousEvents = List<MidiClipEvents>()
	public readonly width: number = GridSequencerState.defaultWidth
	public readonly height: number = GridSequencerState.defaultHeight
	public readonly type = ConnectionNodeType.gridSequencer
	public readonly rate = 1

	constructor(ownerId: string, name: string, notesToShow: number, events: MidiClipEvents, isPlaying = false) {
		this.ownerId = ownerId
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.notesToShow = notesToShow
		this.isPlaying = isPlaying
		this.midiClip = makeMidiClip({
			events: events.map(x => ({...x, startBeat: x.startBeat / 4})),
			length: events.count() / 4,
			loop: true,
		})

		this.scrollY = this._calculateScrollY()

		this.height = GridSequencerState.noteHeight * notesToShow

		const controlsNum = this.height < 120 ? 3 : 2

		const controlsWidth = GridSequencerState.controlSize * controlsNum

		this.width =
			controlsWidth +
			(GridSequencerState.noteWidth * this.midiClip.events.count()) +
			GridSequencerState.scrollBarWidth
	}

	private get maxScrollY() {return MAX_MIDI_NOTE_NUMBER_127 - this.notesToShow}
	private get lowestNote() {return findLowestNote(this.midiClip.events)}
	private get highestNote() {return findHighestNote(this.midiClip.events)}

	private _calculateScrollY() {
		const notesRange = this.highestNote - this.lowestNote
		const desiredScrollY = Math.round(this.lowestNote - (this.notesToShow / 2) + (notesRange / 2))

		return Math.min(this.maxScrollY, desiredScrollY)
	}
}

export function findLowestAndHighestNotes(events: MidiClipEvents) {
	return {
		lowestNote: findLowestNote(events),
		highestNote: findHighestNote(events),
	}
}

export function findLowestNote(events: MidiClipEvents): number {
	let lowest = Number.MAX_VALUE

	events.forEach(event => {
		event.notes.forEach(note => {
			if (note < lowest) {
				lowest = note
			}
		})
	})

	if (lowest === Number.MAX_VALUE) {
		return 0
	}

	return lowest
}

export function findHighestNote(events: MidiClipEvents): number {
	let highest = Number.MIN_VALUE

	events.forEach(event => {
		event.notes.forEach(note => {
			if (note > highest) {
				highest = note
			}
		})
	})

	if (highest === Number.MIN_VALUE) {
		return 127
	}

	return highest
}

const gridSequencerActionTypes = [
	SET_GRID_SEQUENCER_NOTE,
	SET_GRID_SEQUENCER_FIELD,
	CLEAR_SEQUENCER,
	UNDO_SEQUENCER,
]

const gridSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
]

const gridSequencerReducer =
	(gridSequencer: IGridSequencerState, action: AnyAction): IGridSequencerState => {
		switch (action.type) {
			case SET_GRID_SEQUENCER_NOTE:
				if (action.note === undefined) {
					throw new Error('action.notes === undefined')
				}
				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set('events', gridSequencer.midiClip.events.map((event, eventIndex) => {
						if (eventIndex === action.index) {
							if (action.enabled) {
								return {
									...event,
									notes: event.notes.add(action.note),
								}
							} else {
								return {
									...event,
									notes: event.notes.filter(x => x !== action.note),
								}
							}
						} else {
							return event
						}
					})),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			case SET_GRID_SEQUENCER_FIELD:
				if (action.fieldName === 'index') {
					return {
						...gridSequencer,
						[action.fieldName]: action.data % gridSequencer.midiClip.events.count(),
					}
				} else {
					return {
						...gridSequencer,
						[action.fieldName]: action.data,
					}
				}
			case UNDO_SEQUENCER: {
				if (gridSequencer.previousEvents.count() === 0) return gridSequencer

				const prv = Stack(gridSequencer.previousEvents)

				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set('events', prv.first()),
					previousEvents: prv.shift().toList(),
				}
			}
			case CLEAR_SEQUENCER: {
				if (isEmptyEvents(gridSequencer.midiClip.events)) return gridSequencer

				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set(
						'events',
						createSequencerEvents(gridSequencer.midiClip.events.count()),
					),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			}
			case PLAY_ALL: return {...gridSequencer, isPlaying: true}
			case STOP_ALL: return {...gridSequencer, isPlaying: false}
			default:
				return gridSequencer
		}
	}

export const gridSequencersReducer =
	makeMultiReducer<IGridSequencerState, IGridSequencersState>(
		gridSequencerReducer, ConnectionNodeType.gridSequencer,
		gridSequencerActionTypes, gridSequencerGlobalActionTypes,
	)

export const selectAllGridSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.gridSequencers.things

export const selectAllGridSequencerIds = createSelector(
	selectAllGridSequencers,
	gridSequencers => Object.keys(gridSequencers),
)

export const selectGridSequencer = (state: IClientRoomState, id: string) =>
	selectAllGridSequencers(state)[id] || GridSequencerState.dummy

export const selectGridSequencerEvents = (state: IClientRoomState, id: string) =>
	selectGridSequencer(state, id).midiClip.events

export const selectGridSequencerIsActive = (state: IClientRoomState, id: string) =>
	selectGridSequencer(state, id).isPlaying

export const selectGridSequencerIsSending = (state: IClientRoomState, id: string) =>
	selectGridSequencerActiveNotes(state, id).count() > 0

export const selectAllSequencers = createSelector(
	[selectAllGridSequencers, selectAllInfiniteSequencers],
	(gridSeqs, infSeqs) => ({...gridSeqs, ...infSeqs}),
)

export const selectIsAnythingPlaying = createSelector(
	[selectAllSequencers],
	allSeqs => Map(allSeqs).some(x => x.isPlaying),
)

export const selectGridSequencerActiveNotes = createSelector(
	[selectGridSequencer, selectGlobalClockState],
	(gridSequencer, globalClockState) => {
		if (!gridSequencer) return emptyMidiNotes
		if (!gridSequencer.isPlaying) return emptyMidiNotes

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && gridSequencer.midiClip.events.count() > 0) {
			return gridSequencer.midiClip.events.get(index % gridSequencer.midiClip.events.count())!.notes
		} else {
			return emptyMidiNotes
		}
	},
)
