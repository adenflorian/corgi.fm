import {List, Stack, OrderedMap} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {
	assertArrayHasNoUndefinedElements,
} from '../common-utils'
import {makeMidiClipEvent, MidiClip, makeEvents, MidiClipEvents, MidiClipEvent} from '../midi-types'
import {
	deserializeSequencerState, SequencerAction,
	SequencerStateBase,
	selectAllBetterSequencers,
	sequencerActionTypes2,
} from './sequencer-redux'
import {
	addMultiThing, BROADCASTER_ACTION, createSequencerEvents, IClientRoomState,
	IMultiState, IMultiStateThings, isEmptyEvents, makeMultiReducer, NetworkActionType,
	SERVER_ACTION, IClientAppState,
} from '.'

export const addBetterSequencer = (betterSequencer: BetterSequencerState) =>
	addMultiThing(betterSequencer, ConnectionNodeType.betterSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const betterSequencerActions = {
	restart: (id: Id) => ({
		type: 'RESTART_BETTER_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setField: (id: Id, fieldName: BetterSequencerFields, data: any) => ({
		type: 'SET_BETTER_SEQUENCER_FIELD',
		id,
		fieldName,
		data,
		...getNetworkActionThings(fieldName),
	} as const),
	updateEvents: (id: Id, events: MidiClipEvents, saveUndo = true) => ({
		type: 'UPDATE_BETTER_SEQUENCER_EVENTS',
		id,
		events,
		saveUndo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	addEvent: (id: Id, event: MidiClipEvent) => ({
		type: 'ADD_BETTER_SEQUENCER_EVENT',
		id,
		event,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	addEvents: (id: Id, events: MidiClipEvents) => ({
		type: 'ADD_BETTER_SEQUENCER_EVENTS',
		id,
		events,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteEvents: (id: Id, idsToDelete: Iterable<Id>) => ({
		type: 'DELETE_BETTER_SEQUENCER_EVENTS',
		id,
		idsToDelete,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

function getNetworkActionThings(fieldName: BetterSequencerFields) {
	if ([
		BetterSequencerFields.gate,
		BetterSequencerFields.scrollY,
		BetterSequencerFields.pitch,
		BetterSequencerFields.rate,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum BetterSequencerFields {
	gate = 'gate',
	scrollY = 'scrollY',
	index = 'index',
	pitch = 'pitch',
	rate = 'rate',
}

export interface IBetterSequencersState extends IMultiState {
	things: IBetterSequencers
}

export interface IBetterSequencers extends IMultiStateThings {
	[key: string]: BetterSequencerState
}

function foo() {
	let i = 60
	return createSequencerEvents(32)
		.map(() => (makeMidiClipEvent({
			note: i + 60,
			startBeat: i,
			durationBeats: i++ % 4 === 0 ? 2 : 1,
		})))
}

export class BetterSequencerState extends SequencerStateBase {
	public static dummy = new BetterSequencerState(
		makeEvents(), false,
	)

	public constructor(
		events = foo(),
		isPlaying = true,
	) {

		super(
			new MidiClip({
				events: events.map(x => ({
					...x,
					startBeat: x.startBeat,
					durationBeats: x.durationBeats,
				})),
				length: 4 * 8,
				loop: true,
			}),
			ConnectionNodeType.betterSequencer,
			true,
			1,
			1,
			{x: 1, y: 6},
			{x: 0, y: 0.42},
		)
	}
}

export function deserializeBetterSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as BetterSequencerState
	const z = deserializeSequencerState(x)
	const y: BetterSequencerState = {
		...(new BetterSequencerState()),
		...z,
	}
	return y
}

type BetterSequencerActionTypes = {
	[key in BetterSequencerAction['type']]: 0
}

const betterSequencerActionTypes2: BetterSequencerActionTypes = {
	...sequencerActionTypes2,
	SET_BETTER_SEQUENCER_FIELD: 0,
	RESTART_BETTER_SEQUENCER: 0,
	UPDATE_BETTER_SEQUENCER_EVENTS: 0,
	DELETE_BETTER_SEQUENCER_EVENTS: 0,
	ADD_BETTER_SEQUENCER_EVENT: 0,
	ADD_BETTER_SEQUENCER_EVENTS: 0,
}

const betterSequencerActionTypes = Object.keys(betterSequencerActionTypes2)

assertArrayHasNoUndefinedElements(betterSequencerActionTypes)

const betterSequencerGlobalActionTypes = [
	'PLAY_ALL',
	'STOP_ALL',
]

assertArrayHasNoUndefinedElements(betterSequencerGlobalActionTypes)

export type BetterSequencerAction = SequencerAction | ActionType<typeof betterSequencerActions>

const betterSequencerReducer =
	(betterSequencer: BetterSequencerState, action: BetterSequencerAction): BetterSequencerState => {
		switch (action.type) {
			case 'SET_BETTER_SEQUENCER_FIELD':
				if (action.fieldName === 'index') {
					return {
						...betterSequencer,
						[action.fieldName]: action.data % betterSequencer.midiClip.events.count(),
					}
				} else {
					return {
						...betterSequencer,
						[action.fieldName]: action.data,
					}
				}
			case 'UPDATE_BETTER_SEQUENCER_EVENTS': return {
				...betterSequencer,
				midiClip: betterSequencer.midiClip.update('events', events => {
					return events.merge(action.events)
				}),
				previousEvents: action.saveUndo
					? betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events)
					: betterSequencer.previousEvents,
			}
			case 'SEQUENCER_SAVE_UNDO': return {
				...betterSequencer,
				previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
			}
			case 'DELETE_BETTER_SEQUENCER_EVENTS': return {
				...betterSequencer,
				midiClip: betterSequencer.midiClip.update('events', events => {
					return events.deleteAll(action.idsToDelete)
				}),
				previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
			}
			case 'ADD_BETTER_SEQUENCER_EVENT': return {
				...betterSequencer,
				midiClip: betterSequencer.midiClip.update('events', events => {
					return events.set(action.event.id, action.event)
				}),
				previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
			}
			case 'ADD_BETTER_SEQUENCER_EVENTS': return {
				...betterSequencer,
				midiClip: betterSequencer.midiClip.update('events', events => {
					return events.merge(action.events)
				}),
				previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
			}
			case 'SET_SEQUENCER_ZOOM': {
				return {
					...betterSequencer,
					zoom: action.zoom,
				}
			}
			case 'SET_SEQUENCER_PAN': {
				return {
					...betterSequencer,
					pan: action.pan,
				}
			}
			case 'TOGGLE_SEQUENCER_RECORDING': return {...betterSequencer, isRecording: action.isRecording}
			case 'UNDO_SEQUENCER': {
				if (betterSequencer.previousEvents.count() === 0) return betterSequencer

				const prv = Stack(betterSequencer.previousEvents)

				return {
					...betterSequencer,
					midiClip: betterSequencer.midiClip.set('events', prv.first()),
					previousEvents: prv.shift().toList(),
				}
			}
			case 'CLEAR_SEQUENCER': {
				if (isEmptyEvents(betterSequencer.midiClip.events)) return betterSequencer

				return {
					...betterSequencer,
					midiClip: betterSequencer.midiClip.set(
						'events',
						createSequencerEvents(betterSequencer.midiClip.events.count(), 1),
					),
					previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
				}
			}
			case 'PLAY_SEQUENCER': return {...betterSequencer, isPlaying: true}
			case 'STOP_SEQUENCER': return {...betterSequencer, isPlaying: false, isRecording: false}
			case 'PLAY_ALL': return {...betterSequencer, isPlaying: true}
			case 'STOP_ALL': return {...betterSequencer, isPlaying: false, isRecording: false}
			default:
				return betterSequencer
		}
	}

export const betterSequencersReducer =
	makeMultiReducer<BetterSequencerState, IBetterSequencersState>(
		betterSequencerReducer, ConnectionNodeType.betterSequencer,
		betterSequencerActionTypes, betterSequencerGlobalActionTypes,
	)

export const selectAllBetterSequencerIds = createSelector(
	selectAllBetterSequencers,
	betterSequencers => Object.keys(betterSequencers),
)

export const selectBetterSequencer = (state: IClientRoomState, id: Id) =>
	selectAllBetterSequencers(state)[id as string] || BetterSequencerState.dummy

export const createBetterSeqIsRecordingSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).isRecording

export const createBetterSeqIsPlayingSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).isPlaying

export const createBetterSeqRateSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).rate

export const createBetterSeqGateSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).gate

export const createBetterSeqPitchSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).pitch

export const createBetterSeqLengthSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).midiClip.length

export const createBetterSeqZoomSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).zoom

export const createBetterSeqPanSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).pan

export const createBetterSeqMidiClipSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).midiClip

export const selectBetterSequencerEvents = (state: IClientRoomState, id: Id) =>
	selectBetterSequencer(state, id).midiClip.events

export const selectBetterSequencerIsActive = (state: IClientRoomState, id: Id) =>
	selectBetterSequencer(state, id).isPlaying

export const selectBetterSequencerIsSending = (state: IClientRoomState, id: Id) =>
	false
