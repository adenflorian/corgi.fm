import {List, Map, Set, OrderedMap} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {
	ConnectionNodeType, IConnectable, isSequencerNodeType,
} from '../common-types'
import {
	makeMidiClip, makeMidiClipEvent, MidiClip, MidiClipEvent, MidiClipEvents, makeEvents,
} from '../midi-types'
import {IMidiNote} from '../MidiNote'
import {
	selectAllConnections, selectConnectionsWithSourceIds,
	selectConnectionsWithTargetIds,
	IConnectionsState,
} from './connections-redux'
import {selectGlobalClockIsPlaying} from './global-clock-redux'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from '.'

import uuid = require('uuid')

export const sequencerActions = {
	clear: (id: Id) => ({
		type: 'CLEAR_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	undo: (id: Id) => ({
		type: 'UNDO_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	saveUndo: (id: Id) => ({
		type: 'SEQUENCER_SAVE_UNDO',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	skipNote: () => ({
		type: 'SKIP_NOTE',
	} as const),
	recordRest: (id: Id) => ({
		type: 'RECORD_SEQUENCER_REST',
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	play: (id: Id) => ({
		type: 'PLAY_SEQUENCER',
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	stop: (id: Id) => ({
		type: 'STOP_SEQUENCER',
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	playAll: () => ({
		type: 'PLAY_ALL',
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	stopAll: () => ({
		type: 'STOP_ALL',
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	exportMidi: (id: Id) => ({
		type: 'EXPORT_SEQUENCER_MIDI',
		id,
	} as const),
	recordNote: (id: Id, note: IMidiNote, index?: number) => ({
		type: 'RECORD_SEQUENCER_NOTE',
		id,
		note,
		index,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	toggleRecording: (id: Id, isRecording: boolean) => ({
		type: 'TOGGLE_SEQUENCER_RECORDING',
		id,
		isRecording,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	setZoom: (id: Id, zoom: Partial<Point>) => ({
		type: 'SET_SEQUENCER_ZOOM',
		id,
		zoom,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setPan: (id: Id, pan: Partial<Point>) => ({
		type: 'SET_SEQUENCER_PAN',
		id,
		pan,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setZoomAndPan: (id: Id, zoom: Partial<Point>, pan: Partial<Point>) => ({
		type: 'SET_SEQUENCER_ZOOM_AND_PAN',
		id,
		zoom,
		pan,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

type SequencerActionTypes = {
	[key in SequencerAction['type']]: 0
}

export const sequencerActionTypes2: SequencerActionTypes = {
	CLEAR_SEQUENCER: 0,
	UNDO_SEQUENCER: 0,
	PLAY_SEQUENCER: 0,
	STOP_SEQUENCER: 0,
	TOGGLE_SEQUENCER_RECORDING: 0,
	RECORD_SEQUENCER_NOTE: 0,
	EXPORT_SEQUENCER_MIDI: 0,
	PLAY_ALL: 0,
	RECORD_SEQUENCER_REST: 0,
	SKIP_NOTE: 0,
	STOP_ALL: 0,
	SET_SEQUENCER_ZOOM: 0,
	SET_SEQUENCER_PAN: 0,
	SEQUENCER_SAVE_UNDO: 0,
	SET_SEQUENCER_ZOOM_AND_PAN: 0,
}

export type SequencerAction = ActionType<typeof sequencerActions>

export const createSequencerEvents = (length: number, ratio = 1): MidiClipEvents => {
	return makeSequencerEvents(
		List(
			new Array(length)
				.fill(0)
				.map((_, i) => makeMidiClipEvent({note: -1, startBeat: i * ratio, durationBeats: 1 * ratio}))
		),
	)
}

export const makeSequencerEvents =
	(x: List<MidiClipEvent> = List<MidiClipEvent>()): MidiClipEvents => makeEvents(x)

export function deserializeEvents(events: MidiClipEvents): MidiClipEvents {
	return makeSequencerEvents(
		OrderedMap(events)
			// Some could be undefined in old saves
			.filter(x => x !== undefined)
			.map(x => ({...x, note: x.note})
			).toList())
}

export interface ISequencerState extends IConnectable {
	readonly midiClip: MidiClip
	readonly index: number
	readonly isPlaying: boolean
	readonly id: Id
	readonly isRecording: boolean
	readonly previousEvents: List<MidiClipEvents>
	readonly rate: number
	readonly gate: number
	readonly pitch: number
}

export const dummySequencerState: SequencerStateBase = {
	index: -1,
	id: 'dummy sequencer id',
	isRecording: false,
	previousEvents: List<MidiClipEvents>(),
	rate: 1,
	pitch: 0,
	midiClip: makeMidiClip(),
	type: ConnectionNodeType.gridSequencer,
	isPlaying: false,
	gate: 1,
	zoom: {x: 1, y: 1} as Point,
	pan: {x: 0, y: 0} as Point,
}

export abstract class SequencerStateBase implements ISequencerState {
	public readonly index: number = -1
	public readonly id: Id = uuid.v4()
	public readonly isRecording: boolean = false
	public readonly previousEvents: List<MidiClipEvents> = List<MidiClipEvents>()
	public readonly pitch: number = 0

	public constructor(
		public readonly midiClip: MidiClip,
		public readonly type: ConnectionNodeType,
		public readonly isPlaying: boolean = false,
		public readonly gate: number = 1,
		public readonly rate: number = 1,
		public readonly zoom: Point = {x: 1, y: 1},
		public readonly pan: Point = {x: 0, y: 0},
	) {
		// this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
	}
}

export function isEmptyEvents(events: MidiClipEvents) {
	return events.some(x => x.note > -1) === false
}

export function deserializeSequencerState<T extends ISequencerState>(state: IConnectable): T {
	const x = state as T
	const y: T = {
		...x,
		midiClip: new MidiClip({
			length: x.midiClip.length,
			loop: x.midiClip.loop,
			events: deserializeEvents(x.midiClip.events),
		}),
		previousEvents: List(x.previousEvents.map(deserializeEvents)),
	}
	return y
}

export const selectAllGridSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.gridSequencers.things

export const selectAllBetterSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.betterSequencers.things

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.infiniteSequencers.things

export const selectAllSequencers = createSelector(
	[selectAllGridSequencers, selectAllInfiniteSequencers, selectAllBetterSequencers],
	(gridSeqs, infSeqs, betterSeqs) => ({...gridSeqs, ...infSeqs, ...betterSeqs}),
)

export function selectSequencer(state: IClientRoomState, id: Id) {
	return selectAllSequencers(state)[id as string] || dummySequencerState
}

export const selectIsAnythingPlaying = createSelector(
	[selectAllSequencers],
	allSeqs => Map(allSeqs).some(x => x.isPlaying),
)

export const selectSequencerIsPlaying = (state: IClientRoomState, id: Id): boolean => {
	if (selectSequencer(state, id).isPlaying === false) return false
	if (selectGlobalClockIsPlaying(state) === false) return false

	return memoizedIsUpstreamClockFromNode(state, id)
}

let previousConnectionsState = {}
let previousResults = Map<Id, boolean>()

function memoizedIsUpstreamClockFromNode(state: IClientRoomState, nodeId: Id) {
	const newConnectionsState = selectAllConnections(state)

	if (newConnectionsState === previousConnectionsState && previousResults.has(nodeId)) {
		return previousResults.get(nodeId)!
	} else {
		previousConnectionsState = newConnectionsState

		previousResults = previousResults.clear().withMutations(mutable => {
			Map(selectAllSequencers(state)).forEach(sequencer => {
				mutable.set(sequencer.id, isUpstreamClockFromNode(state, sequencer.id))
			})
		})

		return previousResults.get(nodeId)!
	}
}

function isUpstreamClockFromNode(
	state: IClientRoomState, nodeId: Id, processedNodeIds = Set<Id>(),
): boolean {
	if (processedNodeIds.includes(nodeId)) return false

	return selectConnectionsWithTargetIds(state, [nodeId])
		.some(connection => {
			if (connection.sourceType === ConnectionNodeType.masterClock) {
				return true
			} else {
				return isUpstreamClockFromNode(state, connection.sourceId, processedNodeIds.add(nodeId))
			}
		})
}

let lastConnectionsState: IConnectionsState
let cache = Map<Id, List<Id>>()

export const selectDirectDownstreamSequencerIds = (state: IClientRoomState, id: Id): List<Id> => {
	if (state.connections === lastConnectionsState) {
		const foo = cache.get(id, null)
		if (foo) {
			return foo
		} else {
			const foo2 = _bar(state, id)
			cache = cache.set(id, foo2)
			return foo2
		}
	} else {
		lastConnectionsState = state.connections
		const foo = _bar(state, id)
		cache = cache.clear().set(id, foo)
		return foo
	}
}

function _bar(state: IClientRoomState, id: Id): List<Id> {
	return selectConnectionsWithSourceIds(state, [id])
		.filter(connection => isSequencerNodeType(connection.targetType))
		.map(x => x.targetId).toList()
}
