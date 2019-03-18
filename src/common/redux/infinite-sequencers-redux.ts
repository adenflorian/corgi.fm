import {List, Stack} from 'immutable'
import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import {ConnectionNodeType} from '../common-types'
import {makeMidiClipEvent, MidiClip, MidiClipEvents} from '../midi-types'
import {IMidiNote, MidiNotes} from '../MidiNote'
import {
	addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents, IClientRoomState, IMultiState,
	IMultiStateThings, makeMultiReducer, NetworkActionType, PLAY_ALL, selectGlobalClockState,
	SERVER_ACTION, SKIP_NOTE, STOP_ALL, UNDO_SEQUENCER, VIRTUAL_KEY_PRESSED,
} from './index'
import {SequencerStateBase, UNDO_RECORDING_SEQUENCER} from './sequencer-redux'

export const addInfiniteSequencer = (infiniteSequencer: InfiniteSequencerState) =>
	addMultiThing(infiniteSequencer, ConnectionNodeType.infiniteSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_INFINITE_SEQUENCER_NOTE = 'SET_INFINITE_SEQUENCER_NOTE'
export const setInfiniteSequencerNote =
	(infiniteSequencerId: string, index: number, enabled: boolean, note: IMidiNote) => {
		return {
			type: SET_INFINITE_SEQUENCER_NOTE,
			id: infiniteSequencerId,
			index,
			enabled,
			note,
			SERVER_ACTION,
			BROADCASTER_ACTION,
		}
	}

export const RESTART_INFINITE_SEQUENCER = 'RESTART_INFINITE_SEQUENCER'
export const restartInfiniteSequencer = (id: string) => ({
	type: RESTART_INFINITE_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const SET_INFINITE_SEQUENCER_FIELD = 'SET_INFINITE_SEQUENCER_FIELD'
export type SetInfiniteSequencerField = ReturnType<typeof setInfiniteSequencerField>
export const setInfiniteSequencerField =
	(id: string, fieldName: InfiniteSequencerFields, data: any) => ({
		type: SET_INFINITE_SEQUENCER_FIELD,
		id,
		fieldName,
		data,
		...getNetworkFlags(fieldName),
	})

function getNetworkFlags(fieldName: InfiniteSequencerFields) {
	if ([
		InfiniteSequencerFields.gate,
		InfiniteSequencerFields.isPlaying,
		InfiniteSequencerFields.bottomNote,
		InfiniteSequencerFields.isRecording,
		InfiniteSequencerFields.pitch,
		InfiniteSequencerFields.style,
		InfiniteSequencerFields.showRows,
		InfiniteSequencerFields.rate,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum InfiniteSequencerFields {
	gate = 'gate',
	isPlaying = 'isPlaying',
	bottomNote = 'bottomNote',
	index = 'index',
	isRecording = 'isRecording',
	pitch = 'pitch',
	style = 'style',
	showRows = 'showRows',
	rate = 'rate',
}

export interface IInfiniteSequencersState extends IMultiState {
	things: IInfiniteSequencers
}

export interface IInfiniteSequencers extends IMultiStateThings {
	[key: string]: InfiniteSequencerState
}

export enum InfiniteSequencerStyle {
	colorBars = 'colorBars',
	colorGrid = 'colorGrid',
}

export class InfiniteSequencerState extends SequencerStateBase {
	public static defaultWidth = 632
	public static defaultHeight = 80

	public static dummy = new InfiniteSequencerState(
		'dummy', 'dummy', InfiniteSequencerStyle.colorGrid, List(), false,
	)

	public readonly style: InfiniteSequencerStyle
	public readonly showRows: boolean

	constructor(
		ownerId: string,
		name: string,
		style: InfiniteSequencerStyle,
		events: MidiClipEvents,
		isPlaying = false,
	) {
		const midiClip = new MidiClip({
			events,
			length: events.count(),
			loop: true,
		})

		super(
			name,
			midiClip,
			InfiniteSequencerState.defaultWidth,
			InfiniteSequencerState.defaultHeight,
			ownerId,
			ConnectionNodeType.infiniteSequencer,
			isPlaying,
			0.5,
		)

		this.showRows = false
		this.style = style
	}
}

const infiniteSequencerActionTypes = [
	SET_INFINITE_SEQUENCER_NOTE,
	SET_INFINITE_SEQUENCER_FIELD,
	CLEAR_SEQUENCER,
	UNDO_SEQUENCER,
]

const infiniteSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
	VIRTUAL_KEY_PRESSED,
	SKIP_NOTE,
	UNDO_RECORDING_SEQUENCER,
]

export const infiniteSequencersReducer =
	makeMultiReducer<InfiniteSequencerState, IInfiniteSequencersState>(
		infiniteSequencerReducer, ConnectionNodeType.infiniteSequencer,
		infiniteSequencerActionTypes, infiniteSequencerGlobalActionTypes,
	)

function infiniteSequencerReducer(
	infiniteSequencer: InfiniteSequencerState, action: AnyAction,
): InfiniteSequencerState {
	switch (action.type) {
		case SET_INFINITE_SEQUENCER_NOTE: {
			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', mutable.events.map((event, eventIndex) => {
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
					}))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case SET_INFINITE_SEQUENCER_FIELD:
			if (action.fieldName === InfiniteSequencerFields.isRecording && action.data === true) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			} else if (action.fieldName === InfiniteSequencerFields.index) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data % infiniteSequencer.midiClip.events.count(),
				}
			} else if (action.fieldName === InfiniteSequencerFields.isPlaying) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
					isRecording: false,
				}
			} else {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			}
		case UNDO_RECORDING_SEQUENCER:
		case UNDO_SEQUENCER: {
			if (infiniteSequencer.previousEvents.count() === 0) return infiniteSequencer

			const prv = Stack(infiniteSequencer.previousEvents)

			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', prv.first())
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: prv.shift().toList(),
			}
		}
		case CLEAR_SEQUENCER: {
			if (infiniteSequencer.midiClip.events.count() === 0) return infiniteSequencer

			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', createSequencerEvents(0))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case PLAY_ALL: return {...infiniteSequencer, isPlaying: true}
		case STOP_ALL: return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case VIRTUAL_KEY_PRESSED:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
						mutable.set('events', mutable.events
							.concat(makeMidiClipEvent({
								notes: MidiNotes([action.midiNote]),
								startBeat: mutable.events.count(),
								durationBeats: 1,
							})),
						)
						mutable.set('length', mutable.events.count())
					}),
					previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
				}
			} else {
				return infiniteSequencer
			}
		case SKIP_NOTE:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
						mutable.set('events', mutable.events
							.concat({
								notes: MidiNotes(),
								startBeat: mutable.events.count(),
								durationBeats: 1,
							}),
						)
						mutable.set('length', mutable.events.count())
					}),
					previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
				}
			} else {
				return infiniteSequencer
			}
		default:
			return infiniteSequencer
	}
}

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.infiniteSequencers.things

export const selectInfiniteSequencer = (state: IClientRoomState, id: string) => selectAllInfiniteSequencers(state)[id] || InfiniteSequencerState.dummy

export const selectInfiniteSequencerIsActive = (state: IClientRoomState, id: string) =>
	selectInfiniteSequencer(state, id).isPlaying

export const selectInfiniteSequencerIsSending = (state: IClientRoomState, id: string) =>
	selectInfiniteSequencerActiveNotes(state, id).count() > 0

const emptyNotes = MidiNotes()

export const selectInfiniteSequencerActiveNotes = createSelector(
	[selectInfiniteSequencer, selectGlobalClockState],
	(infiniteSequencer, globalClockState) => {
		if (!infiniteSequencer) return emptyNotes
		if (!infiniteSequencer.isPlaying) return emptyNotes

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && infiniteSequencer.midiClip.events.count() > 0) {
			return infiniteSequencer.midiClip.events.get((index / Math.round(infiniteSequencer.rate)) % infiniteSequencer.midiClip.events.count())!.notes
		} else {
			return emptyNotes
		}
	},
)
