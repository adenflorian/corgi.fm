import {Map, Record, Set} from 'immutable'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {
	deserializeSequencerState, IClientRoomState,
	makeGetKeyboardMidiOutput, selectBasicSynthesizer,
	selectGlobalClockIsPlaying, selectGridSequencer,
	selectGridSequencerActiveNotes, selectGridSequencerIsActive,
	selectGridSequencerIsSending, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive,
	selectInfiniteSequencerIsSending, selectSampler,
	selectSimpleReverb, selectVirtualKeyboardById,
	selectVirtualKeyboardIsActive, selectVirtualKeyboardIsSending, VirtualKeyboardState,
} from './index'
import {IClientAppState} from './common-redux-types';
import {addVirtualKeyboard} from './virtual-keyboard-redux';
import {AnyAction} from 'redux';
import {GridSequencerState, addGridSequencer} from './grid-sequencers-redux';
import {InfiniteSequencerState, addInfiniteSequencer} from './infinite-sequencers-redux';
import {BasicSynthesizerState, addBasicSynthesizer} from './basic-synthesizers-redux';
import {BasicSamplerState, addBasicSampler} from './basic-sampler-redux';
import {SimpleReverbState, addSimpleReverb} from './simple-reverb-redux';

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export type IConnectionNodeInfo = ReturnType<typeof makeNodeInfo>

export const dummyIConnectable: IConnectable = Object.freeze({
	color: CssColor.subtleGrayBlackBg,
	id: 'oh no',
	type: ConnectionNodeType.dummy,
	width: 0,
	height: 0,
	name: 'default node name',
})

class DummyConnectable implements IConnectable {
	constructor(
		public readonly color: CssColor.subtleGrayBlackBg,
		public readonly id: 'oh no',
		public readonly type: ConnectionNodeType.dummy,
		public readonly width: 0,
		public readonly height: 0,
		public readonly name: 'default node name',
	) {}
}

const _makeNodeInfo = Record({
	stateSelector: ((roomState: IClientRoomState, id: string) => dummyIConnectable),
	selectIsActive: (() => null) as (roomState: IClientRoomState, id: string) => boolean | null,
	selectIsSending: (() => null) as (roomState: IClientRoomState, id: string) => boolean | null,
	selectActiveNotes: (_: IClientRoomState, __: string) => Set<IMidiNote>(),
	stateDeserializer: ((state: IMultiStateThing) => state) as (state: IMultiStateThing) => IMultiStateThing,
	color: false as string | false,
	typeName: 'Default Type Name',
	stateConstructor: (DummyConnectable) as new (ownerId: string) => IConnectable,
	addNodeActionCreator: ((state: IClientAppState) => {type: 'dummy add node action type'}) as (state: any) => AnyAction,
	showOnAddNodeMenu: false,
})

type NodeInfo = ReturnType<typeof _makeNodeInfo>

function makeNodeInfo(x: Pick<NodeInfo, 'stateSelector' | 'typeName' | 'stateConstructor' | 'addNodeActionCreator'> & Partial<NodeInfo>) {
	return _makeNodeInfo(x)
}

class AudioOutputState implements IConnectable {
	public readonly id = MASTER_AUDIO_OUTPUT_TARGET_ID
	public readonly color = CssColor.green
	public readonly type = ConnectionNodeType.audioOutput
	public readonly width = 192
	public readonly height = 88
	public readonly name = 'audio output'

	constructor() {}
}

const audioOutputState = new AudioOutputState()

class MasterClockState implements IConnectable {
	public readonly id = MASTER_CLOCK_SOURCE_ID
	public readonly color = CssColor.brightBlue
	public readonly type = ConnectionNodeType.masterClock
	public readonly width = 256
	public readonly height = 128
	public readonly name = 'master clock'

	constructor() {}
}

const masterClockState = new MasterClockState()

const NodeInfoMap = Map<ConnectionNodeType, NodeInfo>([
	[ConnectionNodeType.virtualKeyboard, makeNodeInfo({
		typeName: 'Virtual Keyboard',
		stateConstructor: VirtualKeyboardState,
		addNodeActionCreator: addVirtualKeyboard,
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardIsActive,
		selectIsSending: selectVirtualKeyboardIsSending,
		selectActiveNotes: makeGetKeyboardMidiOutput(),
		stateDeserializer: VirtualKeyboardState.fromJS,
	})],
	[ConnectionNodeType.gridSequencer, makeNodeInfo({
		typeName: 'Grid Sequencer',
		stateConstructor: GridSequencerState,
		addNodeActionCreator: addGridSequencer,
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		selectActiveNotes: selectGridSequencerActiveNotes,
		stateDeserializer: deserializeSequencerState,
		showOnAddNodeMenu: true,
	})],
	[ConnectionNodeType.infiniteSequencer, makeNodeInfo({
		typeName: 'Infinite Sequencer',
		stateConstructor: InfiniteSequencerState,
		addNodeActionCreator: addInfiniteSequencer,
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		selectActiveNotes: selectInfiniteSequencerActiveNotes,
		stateDeserializer: deserializeSequencerState,
		showOnAddNodeMenu: true,
	})],
	[ConnectionNodeType.basicSynthesizer, makeNodeInfo({
		typeName: 'Basic Synthesizer',
		stateConstructor: BasicSynthesizerState,
		addNodeActionCreator: addBasicSynthesizer,
		stateSelector: selectBasicSynthesizer,
		showOnAddNodeMenu: true,
	})],
	[ConnectionNodeType.basicSampler, makeNodeInfo({
		typeName: 'Basic Piano Sampler',
		stateConstructor: BasicSamplerState,
		addNodeActionCreator: addBasicSampler,
		stateSelector: selectSampler,
		showOnAddNodeMenu: true,
	})],
	[ConnectionNodeType.simpleReverb, makeNodeInfo({
		typeName: 'R E V E R B',
		stateConstructor: SimpleReverbState,
		addNodeActionCreator: addSimpleReverb,
		stateSelector: selectSimpleReverb,
		showOnAddNodeMenu: true,
	})],
	[ConnectionNodeType.audioOutput, makeNodeInfo({
		typeName: 'Audio Output',
		stateConstructor: AudioOutputState,
		addNodeActionCreator: () => ({type: 'dummy audioOutput type'}),
		stateSelector: () => audioOutputState,
	})],
	[ConnectionNodeType.masterClock, makeNodeInfo({
		typeName: 'Master Clock',
		stateConstructor: MasterClockState,
		addNodeActionCreator: () => ({type: 'dummy masterClock type'}),
		stateSelector: () => masterClockState,
		selectIsActive: selectGlobalClockIsPlaying,
		selectIsSending: selectGlobalClockIsPlaying,
		color: CssColor.brightBlue,
	})],
])

export function isAudioNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.basicSynthesizer,
		ConnectionNodeType.basicSampler,
		ConnectionNodeType.audioOutput,
		ConnectionNodeType.simpleReverb,
	].includes(type)
}

const dummyNodeInfo = _makeNodeInfo()

export const getConnectionNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return NodeInfoMap.get(type) || dummyNodeInfo
}

export function getAddableNodeInfos() {
	return NodeInfoMap.filter(x => x.showOnAddNodeMenu)
}
