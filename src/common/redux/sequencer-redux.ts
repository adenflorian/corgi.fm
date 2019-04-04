import {List, Map, Set} from 'immutable'
import {ActionType} from 'typesafe-actions'
import uuid = require('uuid')
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {makeMidiClipEvent, MidiClip, MidiClipEvent, MidiClipEvents, makeMidiClip} from '../midi-types'
import {emptyMidiNotes, MidiNotes} from '../MidiNote'
import {colorFunc, hashbow} from '../shamu-color'
import {BROADCASTER_ACTION, SERVER_ACTION, IClientRoomState} from './index'
import {NodeSpecialState} from './shamu-graph'
import {createSelector} from 'reselect';
import {selectConnectionsWithTargetIds, selectAllConnections} from './connections-redux';
import {selectGlobalClockIsPlaying} from './global-clock-redux';

export const CLEAR_SEQUENCER = 'CLEAR_SEQUENCER'
export const UNDO_SEQUENCER = 'UNDO_SEQUENCER'
export const UNDO_RECORDING_SEQUENCER = 'UNDO_RECORDING_SEQUENCER'
export const SKIP_NOTE = 'SKIP_NOTE'
export const PLAY_SEQUENCER = 'PLAY_SEQUENCER'
export const STOP_SEQUENCER = 'STOP_SEQUENCER'
export const PLAY_ALL = 'PLAY_ALL'
export const STOP_ALL = 'STOP_ALL'
export const EXPORT_SEQUENCER_MIDI = 'EXPORT_SEQUENCER_MIDI'

export const sequencerActions = Object.freeze({
	clear: (id: string) => ({
		type: CLEAR_SEQUENCER as typeof CLEAR_SEQUENCER,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	undo: (id: string) => ({
		type: UNDO_SEQUENCER as typeof UNDO_SEQUENCER,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	undoRecordingSequencer: () => ({
		type: UNDO_RECORDING_SEQUENCER as typeof UNDO_RECORDING_SEQUENCER,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	skipNote: () => ({
		type: SKIP_NOTE as typeof SKIP_NOTE,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	play: (id: string) => ({
		type: PLAY_SEQUENCER as typeof PLAY_SEQUENCER,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	}),
	stop: (id: string) => ({
		type: STOP_SEQUENCER as typeof STOP_SEQUENCER,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	}),
	playAll: () => ({
		type: PLAY_ALL as typeof PLAY_ALL,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	}),
	stopAll: () => ({
		type: STOP_ALL as typeof STOP_ALL,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	}),
	exportMidi: (sequencerId: string) => ({
		type: EXPORT_SEQUENCER_MIDI as typeof EXPORT_SEQUENCER_MIDI,
		sequencerId,
	}),
})

export type SequencerAction = ActionType<typeof sequencerActions>

export const createSequencerEvents = (length: number, ratio = 1): MidiClipEvents => {
	return makeSequencerEvents(
		new Array(length)
			.fill(0)
			.map((_, i) => makeMidiClipEvent({notes: emptyMidiNotes, startBeat: i * ratio, durationBeats: 1 * ratio})),
	)
}

export const makeSequencerEvents =
	(x: MidiClipEvent[] | List<MidiClipEvent> = Array<MidiClipEvent>()): MidiClipEvents => List<MidiClipEvent>(x)

export function deserializeEvents(events: MidiClipEvents): MidiClipEvents {
	return makeSequencerEvents(events.map(x => ({...x, notes: MidiNotes(x.notes)})))
}

export interface ISequencerState extends IMultiStateThing, NodeSpecialState {
	midiClip: MidiClip
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
	isRecording: boolean
	previousEvents: List<MidiClipEvents>
	width: number
	height: number
	rate: number
	gate: number
	pitch: number
	notesDisplayStartX: number
	notesDisplayWidth: number
}

export const dummySequencerState: Readonly<SequencerStateBase> = Object.freeze({
	index: -1,
	id: 'dummy sequencer id',
	color: 'black',
	isRecording: false,
	previousEvents: List<MidiClipEvents>(),
	rate: 1,
	pitch: 0,
	name: 'dummy sequencer name',
	midiClip: makeMidiClip(),
	width: 0,
	height: 0,
	ownerId: 'dummy owner id',
	type: ConnectionNodeType.gridSequencer,
	notesDisplayStartX: 1,
	notesDisplayWidth: 1,
	isPlaying: false,
	gate: 1,
})

export abstract class SequencerStateBase implements ISequencerState {
	public readonly index: number = -1
	public readonly id = uuid.v4()
	public readonly color: string
	public readonly isRecording: boolean = false
	public readonly previousEvents: List<MidiClipEvents> = List<MidiClipEvents>()
	public readonly rate: number = 1
	public readonly pitch: number = 0

	constructor(
		public readonly name: string,
		public readonly midiClip: MidiClip,
		public readonly width: number,
		public readonly height: number,
		public readonly ownerId: string,
		public readonly type: ConnectionNodeType,
		public readonly notesDisplayStartX: number,
		public readonly notesDisplayWidth: number,
		public readonly isPlaying: boolean = false,
		public readonly gate: number = 1,
	) {
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
	}
}

export function isEmptyEvents(events: MidiClipEvents) {
	return events.some(x => x.notes.count() > 0) === false
}

export function deserializeSequencerState<T extends ISequencerState>(state: IMultiStateThing): IMultiStateThing {
	const x = state as T
	const y = {
		...x,
		midiClip: new MidiClip({
			length: x.midiClip.length,
			loop: x.midiClip.loop,
			events: deserializeEvents(x.midiClip.events),
		}),
		previousEvents: List(x.previousEvents.map(deserializeEvents)),
	} as T
	return y
}

export const selectAllGridSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.gridSequencers.things

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.infiniteSequencers.things

export const selectAllSequencers = createSelector(
	[selectAllGridSequencers, selectAllInfiniteSequencers],
	(gridSeqs, infSeqs) => ({...gridSeqs, ...infSeqs}),
)

export function selectSequencer(state: IClientRoomState, id: string) {
	return selectAllSequencers(state)[id] || dummySequencerState
}

export const selectSequencerIsPlaying = (state: IClientRoomState, id: string): boolean => {
	if (selectSequencer(state, id).isPlaying === false) return false
	if (selectGlobalClockIsPlaying(state) === false) return false

	return memoizedIsUpstreamClockFromNode(state, id)
}

let previousConnectionsState = {}
let previousResults = Map<string, boolean>()

function memoizedIsUpstreamClockFromNode(state: IClientRoomState, nodeId: string) {
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
	state: IClientRoomState, nodeId: string, processedNodeIds = Set<string>()
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

export const selectIsAnythingPlaying = createSelector(
	[selectAllSequencers],
	allSeqs => Map(allSeqs).some(x => x.isPlaying),
)
