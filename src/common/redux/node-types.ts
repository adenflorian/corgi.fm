import {Map, Record, Set} from 'immutable'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {
	deserializeSequencerState, GridSequencerState, IClientRoomState,
	InfiniteSequencerState, makeGetKeyboardMidiOutput, selectBasicSynthesizer,
	selectGlobalClockIsPlaying, selectGridSequencer,
	selectGridSequencerActiveNotes, selectGridSequencerIsActive,
	selectGridSequencerIsSending, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive,
	selectInfiniteSequencerIsSending, selectSampler,
	selectSimpleReverb, selectVirtualKeyboardById,
	selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending, VirtualKeyboardState,
} from './index'

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export type IConnectionNodeInfo = ReturnType<typeof NodeInfoRecord>

export const NodeInfoRecord = Record({
	stateSelector: (() => ({
		color: CssColor.subtleGrayBlackBg,
		id: 'oh no',
		type: ConnectionNodeType.dummy,
	})) as (roomState: IClientRoomState, id: string) => IConnectable,
	selectIsActive: (() => null) as (roomState: IClientRoomState, id: string) => boolean | null,
	selectIsSending: (() => null) as (roomState: IClientRoomState, id: string) => boolean | null,
	selectActiveNotes: (_: IClientRoomState, __: string) => Set<IMidiNote>(),
	stateDeserializer: ((state: IMultiStateThing) => state) as (state: IMultiStateThing) => IMultiStateThing,
	width: 0,
	height: 0,
	color: false as string | false,
})

export const NodeInfoMap = Map({
	[ConnectionNodeType.virtualKeyboard]: NodeInfoRecord({
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardIsActive,
		selectIsSending: selectVirtualKeyboardIsSending,
		selectActiveNotes: makeGetKeyboardMidiOutput(),
		stateDeserializer: VirtualKeyboardState.fromJS,
		width: 456,
		height: 56,
	}),
	[ConnectionNodeType.gridSequencer]: NodeInfoRecord({
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		selectActiveNotes: selectGridSequencerActiveNotes,
		stateDeserializer: deserializeSequencerState,
		width: GridSequencerState.defaultWidth,	// TODO Make into a function
		height: GridSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.infiniteSequencer]: NodeInfoRecord({
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		selectActiveNotes: selectInfiniteSequencerActiveNotes,
		stateDeserializer: deserializeSequencerState,
		width: InfiniteSequencerState.defaultWidth,
		height: InfiniteSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.basicSynthesizer]: NodeInfoRecord({
		stateSelector: selectBasicSynthesizer,
		width: 304,
		height: 112,
	}),
	[ConnectionNodeType.basicSampler]: NodeInfoRecord({
		stateSelector: selectSampler,
		width: 256,
		height: 112,
	}),
	[ConnectionNodeType.simpleReverb]: NodeInfoRecord({
		stateSelector: selectSimpleReverb,
		width: 256 + 16, // main width plus padding
		height: 56,
	}),
	[ConnectionNodeType.audioOutput]: NodeInfoRecord({
		stateSelector: () => ({
			id: MASTER_AUDIO_OUTPUT_TARGET_ID,
			color: CssColor.green,
			type: ConnectionNodeType.audioOutput,
		}),
		width: 192,
		height: 88,
	}),
	[ConnectionNodeType.masterClock]: NodeInfoRecord({
		stateSelector: () => ({
			id: MASTER_CLOCK_SOURCE_ID,
			color: CssColor.blue,
			type: ConnectionNodeType.masterClock,
		}),
		selectIsActive: selectGlobalClockIsPlaying,
		selectIsSending: selectGlobalClockIsPlaying,
		width: 256,
		height: 128,
		color: CssColor.blue,
	}),
})

export function isAudioNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.basicSynthesizer,
		ConnectionNodeType.basicSampler,
		ConnectionNodeType.audioOutput,
		ConnectionNodeType.simpleReverb,
	].includes(type)
}

const dummyNodeInfo = NodeInfoRecord()

export const getConnectionNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return NodeInfoMap.get(type) || dummyNodeInfo
}
