import {Map, Record} from 'immutable'
import {CssColor} from '../shamu-color'
import {selectBasicInstrument} from './basic-instruments-redux'
import {selectSampler} from './basic-sampler-redux'
import {IClientRoomState} from './common-redux-types'
import {
	GridSequencerState, selectGridSequencer, selectGridSequencerIsActive, selectGridSequencerIsSending,
} from './grid-sequencers-redux'
import {
	InfiniteSequencerState, selectInfiniteSequencer, selectInfiniteSequencerIsActive, selectInfiniteSequencerIsSending,
} from './infinite-sequencers-redux'
import {
	selectVirtualKeyboardById, selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending,
} from './virtual-keyboard-redux'

export type IConnectableStateSelector = (roomState: IClientRoomState, id: string) => IConnectable

export type IConnectableIsActiveSelector = (roomState: IClientRoomState, id: string) => boolean | null

export type IConnectableIsSendingSelector = (roomState: IClientRoomState, id: string) => boolean | null

export interface IConnectable {
	id: string
	color: string | false
}

export enum ConnectionNodeType {
	keyboard = 'keyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	instrument = 'instrument',
	sampler = 'sampler',
	audioOutput = 'audioOutput',
	masterClock = 'masterClock',
	dummy = 'dummy',
}

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export interface IConnectionNodeInfo {
	stateSelector: IConnectableStateSelector,
	selectIsActive: IConnectableIsActiveSelector,
	selectIsSending: IConnectableIsActiveSelector,
	width: number,
	height: number,
}

export const NodeInfoRecord = Record<IConnectionNodeInfo>({
	stateSelector: () => ({
		color: CssColor.subtleGrayBlackBg,
		id: 'oh no',
	}),
	selectIsActive: () => null,
	selectIsSending: () => null,
	width: 0,
	height: 0,
})

export const NodeInfoMap = Map({
	[ConnectionNodeType.keyboard]: NodeInfoRecord({
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardIsActive,
		selectIsSending: selectVirtualKeyboardIsSending,
		width: 456,
		height: 56,
	}),
	[ConnectionNodeType.gridSequencer]: NodeInfoRecord({
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		width: GridSequencerState.defaultWidth,
		height: GridSequencerState.defaultHeight,
	}),
	[ConnectionNodeType.infiniteSequencer]: NodeInfoRecord({
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
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
		stateSelector: () => ({id: MASTER_AUDIO_OUTPUT_TARGET_ID, color: CssColor.green}),
		width: 140.48,
		height: 48,
	}),
	[ConnectionNodeType.masterClock]: NodeInfoRecord({
		stateSelector: () => ({id: MASTER_CLOCK_SOURCE_ID, color: CssColor.blue}),
		selectIsActive: () => false,
		selectIsSending: () => false,
		width: 134.813,
		height: 72,
	}),
})
