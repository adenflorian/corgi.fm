import {Map, Record, Set} from 'immutable'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {GridSequencerState, IClientRoomState, InfiniteSequencerState, makeGetKeyboardMidiOutput, selectBasicInstrument, selectGridSequencer, selectGridSequencerActiveNotes, selectGridSequencerIsActive, selectGridSequencerIsSending, selectInfiniteSequencer, selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive, selectInfiniteSequencerIsSending, selectSampler, selectVirtualKeyboardById, selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending} from './index'
import {deserializeSequencerState} from './sequencer-redux'
import {VirtualKeyboardState} from './virtual-keyboard-redux'

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
		width: GridSequencerState.defaultWidth,
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
	[ConnectionNodeType.basicInstrument]: NodeInfoRecord({
		stateSelector: selectBasicInstrument,
		width: 416,
		height: 56,
	}),
	[ConnectionNodeType.basicSampler]: NodeInfoRecord({
		stateSelector: selectSampler,
		width: 416,
		height: 56,
	}),
	[ConnectionNodeType.audioOutput]: NodeInfoRecord({
		stateSelector: () => ({
			id: MASTER_AUDIO_OUTPUT_TARGET_ID,
			color: CssColor.green,
			type: ConnectionNodeType.audioOutput,
		}),
		width: 140.48,
		height: 48,
	}),
	[ConnectionNodeType.masterClock]: NodeInfoRecord({
		stateSelector: () => ({
			id: MASTER_CLOCK_SOURCE_ID,
			color: CssColor.blue,
			type: ConnectionNodeType.masterClock,
		}),
		// Return false because it is left most node on graph
		selectIsActive: () => false,
		selectIsSending: () => false,
		width: 134.813,
		height: 72,
	}),
})

const dummyNodeInfo = NodeInfoRecord()

export const getConnectionNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return NodeInfoMap.get(type) || dummyNodeInfo
}
