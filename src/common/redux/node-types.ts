import {Map, Record} from 'immutable'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {IMidiNotes} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {selectBasicInstrument} from './basic-instruments-redux'
import {selectSampler} from './basic-sampler-redux'
import {IClientRoomState} from './common-redux-types'
import {
	GridSequencerState, selectGridSequencer, selectGridSequencerActiveNotes,
	selectGridSequencerIsActive, selectGridSequencerIsSending,
} from './grid-sequencers-redux'
import {
	InfiniteSequencerState, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive, selectInfiniteSequencerIsSending,
} from './infinite-sequencers-redux'
import {
	makeGetKeyboardMidiOutput, selectVirtualKeyboardById, selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending,
} from './virtual-keyboard-redux'

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
	selectActiveNotes: (() => []) as (roomState: IClientRoomState, id: string) => IMidiNotes,
	width: 0,
	height: 0,
})

export const NodeInfoMap = Map({
	[ConnectionNodeType.keyboard]: NodeInfoRecord({
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardIsActive,
		selectIsSending: selectVirtualKeyboardIsSending,
		selectActiveNotes: makeGetKeyboardMidiOutput(),
		width: 456,
		height: 56,
	}),
	[ConnectionNodeType.gridSequencer]: NodeInfoRecord({
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		selectActiveNotes: selectGridSequencerActiveNotes,
		width: GridSequencerState.defaultWidth,
		height: GridSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.infiniteSequencer]: NodeInfoRecord({
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		selectActiveNotes: selectInfiniteSequencerActiveNotes,
		width: InfiniteSequencerState.defaultWidth,
		height: InfiniteSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.instrument]: NodeInfoRecord({
		stateSelector: selectBasicInstrument,
		width: 416,
		height: 56,
	}),
	[ConnectionNodeType.sampler]: NodeInfoRecord({
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
