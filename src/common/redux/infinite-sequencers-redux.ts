import {List, Stack} from 'immutable'
import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ConnectionNodeType, IConnectable, MidiClipEvents, makeMidiClip, MidiClip} from '../common-types'
import {IMidiNote, MidiNotes} from '../MidiNote'
import {colorFunc, hashbow} from '../shamu-color'
import {
	addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents,
	IClientRoomState, IMultiState, IMultiStateThings, ISequencerState,
	makeMultiReducer, NetworkActionType, PLAY_ALL, selectGlobalClockState,
	SERVER_ACTION, SKIP_NOTE, STOP_ALL, UNDO_SEQUENCER, VIRTUAL_KEY_PRESSED
} from './index'
import {makeSequencerEvents} from './sequencer-redux'
import {NodeSpecialState} from './shamu-graph'

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
		InfiniteSequencerFields.isPlaying,
		InfiniteSequencerFields.bottomNote,
		InfiniteSequencerFields.isRecording,
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
	isPlaying = 'isPlaying',
	bottomNote = 'bottomNote',
	index = 'index',
	isRecording = 'isRecording',
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

export class InfiniteSequencerState implements ISequencerState, IConnectable, NodeSpecialState {
	public static defaultWidth = 576
	public static defaultHeight = 80

	public static dummy: InfiniteSequencerState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		index: -1,
		isPlaying: false,
		color: 'gray',
		name: 'dummy',
		isRecording: false,
		previousEvents: List<MidiClipEvents>(),
		type: ConnectionNodeType.infiniteSequencer,
		style: InfiniteSequencerStyle.colorGrid,
		showRows: false,
		width: InfiniteSequencerState.defaultWidth,
		height: InfiniteSequencerState.defaultHeight,
		rate: 1,
		midiClip: makeMidiClip({
			events: List(),
			length: 0,
			loop: false
		}),
	}

	public readonly id: string = uuid.v4()
	public readonly ownerId: string
	public readonly midiClip: MidiClip
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly isRecording: boolean = false
	public readonly style: InfiniteSequencerStyle
	public readonly previousEvents = List<MidiClipEvents>()
	public readonly showRows = false
	public readonly width: number = InfiniteSequencerState.defaultWidth
	public readonly height: number = InfiniteSequencerState.defaultHeight
	public readonly type = ConnectionNodeType.infiniteSequencer
	public readonly rate = 1

	constructor(ownerId: string, name: string, style: InfiniteSequencerStyle, events = makeSequencerEvents(), isPlaying = false) {
		this.ownerId = ownerId
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.style = style
		this.isPlaying = isPlaying
		this.midiClip = makeMidiClip({
			events: events,
			length: events.count(),
			loop: true
		})
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
				midiClip: {
					...infiniteSequencer.midiClip,
					events: infiniteSequencer.midiClip.events.map((event, eventIndex) => {
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
					}),
				},
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
		case UNDO_SEQUENCER: {
			if (infiniteSequencer.previousEvents.count() === 0) return infiniteSequencer

			const prv = Stack(infiniteSequencer.previousEvents)

			return {
				...infiniteSequencer,
				midiClip: {
					...infiniteSequencer.midiClip,
					events: prv.first(),
				},
				previousEvents: prv.shift().toList(),
			}
		}
		case CLEAR_SEQUENCER: {
			if (infiniteSequencer.midiClip.events.count() === 0) return infiniteSequencer

			return {
				...infiniteSequencer,
				midiClip: {
					...infiniteSequencer.midiClip,
					events: createSequencerEvents(0),
				},
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case PLAY_ALL: return {...infiniteSequencer, isPlaying: true}
		case STOP_ALL: return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case VIRTUAL_KEY_PRESSED:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					midiClip: {
						...infiniteSequencer.midiClip,
						events: infiniteSequencer.midiClip.events
							.concat({
								notes: MidiNotes([action.midiNote]),
								startBeat: infiniteSequencer.midiClip.events.count()
							}),
					},
					previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
				}
			} else {
				return infiniteSequencer
			}
		case SKIP_NOTE:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					midiClip: {
						...infiniteSequencer.midiClip,
						events: infiniteSequencer.midiClip.events
							.concat({
								notes: MidiNotes(),
								startBeat: infiniteSequencer.midiClip.events.count()
							}),
					},
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
