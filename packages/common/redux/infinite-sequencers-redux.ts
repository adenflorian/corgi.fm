import {List, Set, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {assertArrayHasNoUndefinedElements} from '../common-utils'
import {logger} from '../logger'
import {makeMidiClipEvent, MidiClip, makeEvents} from '../midi-types'
import {IMidiNote, MidiNotes} from '../MidiNote'
import {
	deserializeSequencerState,
	selectAllInfiniteSequencers, SequencerAction, SequencerStateBase, sequencerActionTypes2,
} from './sequencer-redux'
import {VirtualKeyPressedAction} from './virtual-keyboard-redux'
import {IClientAppState} from './common-redux-types'
import {
	addMultiThing, BROADCASTER_ACTION, createSequencerEvents, IClientRoomState, IMultiState,
	IMultiStateThings, makeMultiReducer, NetworkActionType, selectGlobalClockState,
	SERVER_ACTION,
} from '.'

export const addInfiniteSequencer = (infiniteSequencer: InfiniteSequencerState) =>
	addMultiThing(infiniteSequencer, ConnectionNodeType.infiniteSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const infiniteSequencerActions = {
	setNote: (infiniteSequencerId: Id, index: number, enabled: boolean, note: IMidiNote) => ({
		type: 'SET_INFINITE_SEQUENCER_NOTE',
		id: infiniteSequencerId,
		index,
		enabled,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteNote: (infiniteSequencerId: Id, index: number) => ({
		type: 'DELETE_INFINITE_SEQUENCER_NOTE',
		id: infiniteSequencerId,
		index,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	restart: (id: Id) => ({
		type: 'RESTART_INFINITE_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setField: (id: Id, fieldName: InfiniteSequencerFields, data: any) => ({
		type: 'SET_INFINITE_SEQUENCER_FIELD',
		id,
		fieldName,
		data,
		...getNetworkFlags(fieldName),
	} as const),
}

function getNetworkFlags(fieldName: InfiniteSequencerFields) {
	if ([
		InfiniteSequencerFields.gate,
		InfiniteSequencerFields.bottomNote,
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
	bottomNote = 'bottomNote',
	index = 'index',
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

function foo() {
	let i = 0
	return createSequencerEvents(4)
		.map(() => (makeMidiClipEvent({
			note: i % 2 === 1 ? -1 : 36,
			startBeat: i++,
			durationBeats: 1,
		})))
}

export class InfiniteSequencerState extends SequencerStateBase {
	public static defaultWidth = 688
	public static defaultHeight = 88
	public static controlsWidth = (40 * 4) + (64 * 3)
	public static notesStartX = InfiniteSequencerState.controlsWidth + 4
	public static notesWidth = InfiniteSequencerState.defaultWidth - InfiniteSequencerState.controlsWidth - 8

	public static dummy = new InfiniteSequencerState(
		'dummy', InfiniteSequencerStyle.colorGrid, makeEvents(), false,
	)

	public readonly style: InfiniteSequencerStyle
	public readonly showRows: boolean

	public constructor(
		ownerId: Id,
		style = InfiniteSequencerStyle.colorGrid,
		events = foo(),
		isPlaying = false,
	) {
		const midiClip = new MidiClip({
			events,
			length: events.count(),
			loop: true,
		})

		super(
			midiClip,
			ownerId,
			ConnectionNodeType.infiniteSequencer,
			isPlaying,
			0.5,
		)

		this.showRows = false
		this.style = style
	}
}

export function deserializeInfiniteSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as InfiniteSequencerState
	const y: InfiniteSequencerState = {
		...(new InfiniteSequencerState(x.ownerId)),
		...(deserializeSequencerState(x)),
		// width: Math.max(x.width, InfiniteSequencerState.defaultWidth),
		// height: Math.max(x.height, InfiniteSequencerState.defaultHeight),
		// notesDisplayStartX: InfiniteSequencerState.notesStartX,
		// notesDisplayWidth: InfiniteSequencerState.notesWidth,
	}
	return y
}

type InfiniteSequencerActionTypes = {
	[key in InfiniteSequencerAction['type']]: 0
}

const infiniteSequencerActionTypes2: InfiniteSequencerActionTypes = {
	...sequencerActionTypes2,
	SET_INFINITE_SEQUENCER_NOTE: 0,
	DELETE_INFINITE_SEQUENCER_NOTE: 0,
	SET_INFINITE_SEQUENCER_FIELD: 0,
	RESTART_INFINITE_SEQUENCER: 0,
	VIRTUAL_KEY_PRESSED: 0,
}

const infiniteSequencerActionTypes = Object.keys(infiniteSequencerActionTypes2)

assertArrayHasNoUndefinedElements(infiniteSequencerActionTypes)

const infiniteSequencerGlobalActionTypes = [
	'PLAY_ALL',
	'STOP_ALL',
	'VIRTUAL_KEY_PRESSED',
	'SKIP_NOTE',
]

assertArrayHasNoUndefinedElements(infiniteSequencerGlobalActionTypes)

type InfiniteSequencerAction = SequencerAction | ActionType<typeof infiniteSequencerActions> | VirtualKeyPressedAction

export const infiniteSequencersReducer =
	makeMultiReducer<InfiniteSequencerState, IInfiniteSequencersState>(
		infiniteSequencerReducer, ConnectionNodeType.infiniteSequencer,
		infiniteSequencerActionTypes, infiniteSequencerGlobalActionTypes,
	)

function infiniteSequencerReducer(
	infiniteSequencer: InfiniteSequencerState, action: InfiniteSequencerAction,
): InfiniteSequencerState {
	switch (action.type) {
		case 'SET_INFINITE_SEQUENCER_NOTE': {
			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', mutable.events.map(event => {
						if (event.startBeat === action.index) {
							if (action.enabled) {
								return {
									...event,
									note: action.note,
								}
							} else {
								return {
									...event,
									note: -1,
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
		case 'DELETE_INFINITE_SEQUENCER_NOTE': {
			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set(
						'events',
						mutable.events.filter(({startBeat}) => startBeat !== action.index)
							.map(event => event.startBeat > action.index ? {...event, startBeat: event.startBeat - 1} : event))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case 'TOGGLE_SEQUENCER_RECORDING': return {...infiniteSequencer, isRecording: action.isRecording}
		case 'SET_INFINITE_SEQUENCER_FIELD':
			if (action.fieldName === InfiniteSequencerFields.index) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data % infiniteSequencer.midiClip.events.count(),
				}
			} else {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			}
		case 'UNDO_SEQUENCER': {
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
		case 'CLEAR_SEQUENCER': {
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
		case 'PLAY_SEQUENCER': return {...infiniteSequencer, isPlaying: true, isRecording: false}
		case 'STOP_SEQUENCER': return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case 'PLAY_ALL': return {...infiniteSequencer, isPlaying: true}
		case 'STOP_ALL': return {...infiniteSequencer, isPlaying: false, isRecording: false}
		// case 'RECORD_SEQUENCER_REST':
		// case 'RECORD_SEQUENCER_NOTE':
		// 	if (infiniteSequencer.isRecording) {
		// 		return {
		// 			...infiniteSequencer,
		// 			midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
		// 				mutable.set('events', mutable.events
		// 					.concat(makeMidiClipEvent({
		// 						note: action.type === 'RECORD_SEQUENCER_NOTE'
		// 							? action.note
		// 							: action.type === 'RECORD_SEQUENCER_REST'
		// 								? -1
		// 								: (() => {logger.error('nope'); return -1})(),
		// 						startBeat: mutable.events.count(),
		// 						durationBeats: 1,
		// 					})),
		// 				)
		// 				mutable.set('length', mutable.events.count())
		// 			}),
		// 			previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
		// 		}
		// 	} else {
		// 		return infiniteSequencer
		// 	}
		default:
			return infiniteSequencer
	}
}

export const selectInfiniteSequencer = (state: IClientRoomState, id: Id) =>
	selectAllInfiniteSequencers(state)[id as string] || InfiniteSequencerState.dummy

export const selectInfiniteSequencerStyle = (id: Id) => (state: IClientAppState) =>
	selectInfiniteSequencer(state.room, id).style

export const selectInfiniteSequencerShowRows = (id: Id) => (state: IClientAppState) =>
	selectInfiniteSequencer(state.room, id).showRows

export const selectInfiniteSequencerIsRecording = (id: Id) => (state: IClientAppState) =>
	selectInfiniteSequencer(state.room, id).isRecording

export const selectInfiniteSequencerIsActive = (state: IClientRoomState, id: Id) =>
	selectInfiniteSequencer(state, id).isPlaying

export const selectInfiniteSequencerIsSending = (state: IClientRoomState, id: Id) =>
	false
