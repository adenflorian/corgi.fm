import {Map, Record, Set} from 'immutable'
import {AnyAction} from 'redux'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {IClientAppState} from './common-redux-types'
import {selectConnectionsWithTargetIds} from './connections-redux'
import {addGridSequencer, deserializeGridSequencerState, GridSequencerState} from './grid-sequencers-redux'
import {addGroupSequencer, deserializeGroupSequencerState, GroupSequencer, selectGroupSequencer} from './group-sequencers-redux'
import {
	addBasicSampler, addBasicSynthesizer,
	BasicSamplerState, BasicSynthesizerState,
	deserializeBasicSamplerState, deserializeBasicSynthesizerState,
	IClientRoomState,
	makeGetKeyboardMidiOutput, selectBasicSynthesizer,
	selectGlobalClockIsPlaying, selectGridSequencer,
	selectGridSequencerActiveNotes, selectGridSequencerIsActive,
	selectGridSequencerIsSending, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive,
	selectInfiniteSequencerIsSending, selectSampler, selectSimpleReverb, selectVirtualKeyboardById,
	selectVirtualKeyboardHasPressedKeys, VirtualKeyboardState,
} from './index'
import {addInfiniteSequencer, deserializeInfiniteSequencerState, InfiniteSequencerState} from './infinite-sequencers-redux'
import {selectSequencerIsPlaying} from './sequencer-redux'
import {addSimpleCompressor, deserializeSimpleCompressorState, selectSimpleCompressor, SimpleCompressorState} from './simple-compressor-redux'
import {addSimpleReverb, deserializeSimpleReverbState, SimpleReverbState} from './simple-reverb-redux'
import {addVirtualKeyboard} from './virtual-keyboard-redux'

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
	selectIsPlaying: (() => false) as (roomState: IClientRoomState, id: string, processedIds?: Set<string>) => boolean,
	selectActiveNotes: (_: IClientRoomState, __: string) => Set<IMidiNote>(),
	stateDeserializer: ((state: IMultiStateThing) => state) as (state: IMultiStateThing) => IMultiStateThing,
	color: false as string | false,
	typeName: 'Default Type Name',
	stateConstructor: (DummyConnectable) as new (ownerId: string) => IConnectable,
	addNodeActionCreator: ((state: IClientAppState) => ({type: 'dummy add node action type'})) as (state: any) => AnyAction,
	showOnAddNodeMenu: false,
	isDeletable: false,
	autoConnectToClock: false,
	autoConnectToAudioOutput: false,
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
	public readonly width = 172
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
		selectIsActive: selectVirtualKeyboardHasPressedKeys,
		selectIsSending: selectVirtualKeyboardHasPressedKeys,
		selectIsPlaying: selectVirtualKeyboardHasPressedKeys,
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
		selectIsPlaying: selectSequencerIsPlaying,
		selectActiveNotes: selectGridSequencerActiveNotes,
		stateDeserializer: deserializeGridSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
	})],
	[ConnectionNodeType.infiniteSequencer, makeNodeInfo({
		typeName: 'Infinite Sequencer',
		stateConstructor: InfiniteSequencerState,
		addNodeActionCreator: addInfiniteSequencer,
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		selectIsPlaying: selectSequencerIsPlaying,
		selectActiveNotes: selectInfiniteSequencerActiveNotes,
		stateDeserializer: deserializeInfiniteSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
	})],
	[ConnectionNodeType.groupSequencer, makeNodeInfo({
		typeName: 'Group Sequencer',
		stateConstructor: GroupSequencer,
		addNodeActionCreator: addGroupSequencer,
		stateSelector: selectGroupSequencer,
		stateDeserializer: deserializeGroupSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
	})],
	[ConnectionNodeType.basicSynthesizer, makeNodeInfo({
		typeName: 'Basic Synthesizer',
		stateConstructor: BasicSynthesizerState,
		addNodeActionCreator: addBasicSynthesizer,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectBasicSynthesizer,
		stateDeserializer: deserializeBasicSynthesizerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
	})],
	[ConnectionNodeType.basicSampler, makeNodeInfo({
		typeName: 'Basic Piano Sampler',
		stateConstructor: BasicSamplerState,
		addNodeActionCreator: addBasicSampler,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSampler,
		stateDeserializer: deserializeBasicSamplerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
	})],
	[ConnectionNodeType.simpleReverb, makeNodeInfo({
		typeName: 'R E V E R B',
		stateConstructor: SimpleReverbState,
		addNodeActionCreator: addSimpleReverb,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSimpleReverb,
		stateDeserializer: deserializeSimpleReverbState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
	})],
	[ConnectionNodeType.simpleCompressor, makeNodeInfo({
		typeName: 'Compressor',
		stateConstructor: SimpleCompressorState,
		addNodeActionCreator: addSimpleCompressor,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSimpleCompressor,
		stateDeserializer: deserializeSimpleCompressorState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
	})],
	[ConnectionNodeType.audioOutput, makeNodeInfo({
		typeName: 'Audio Output',
		stateConstructor: AudioOutputState,
		addNodeActionCreator: () => ({type: 'dummy audioOutput type'}),
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: () => audioOutputState,
	})],
	[ConnectionNodeType.masterClock, makeNodeInfo({
		typeName: 'Master Clock',
		stateConstructor: MasterClockState,
		addNodeActionCreator: () => ({type: 'dummy masterClock type'}),
		stateSelector: () => masterClockState,
		selectIsActive: selectGlobalClockIsPlaying,
		selectIsSending: selectGlobalClockIsPlaying,
		selectIsPlaying: selectGlobalClockIsPlaying,
		color: CssColor.brightBlue,
	})],
])

export function isAudioNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.basicSynthesizer,
		ConnectionNodeType.basicSampler,
		ConnectionNodeType.audioOutput,
		ConnectionNodeType.simpleReverb,
		ConnectionNodeType.simpleCompressor,
	].includes(type)
}

const dummyNodeInfo = _makeNodeInfo()

export const getConnectionNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return NodeInfoMap.get(type) || dummyNodeInfo
}

export function getAddableNodeInfos() {
	return NodeInfoMap.filter(x => x.showOnAddNodeMenu)
}

// TODO Memoize?
function selectIsUpstreamNodePlaying(state: IClientRoomState, id: string, processedNodeIds = Set<string>()): boolean {
	return memoizedIsUpstreamNodePlaying(state, id, processedNodeIds)
}

// let previousConnectionsState = {}
// let previousResult = false

function memoizedIsUpstreamNodePlaying(state: IClientRoomState, nodeId: string, processedNodeIds: Set<string>) {
	return isUpstreamNodePlaying(state, nodeId, processedNodeIds)

	// const newConnectionsState = selectAllConnections(state)

	// if (newConnectionsState === previousConnectionsState) {
	// 	return previousResult
	// } else {
	// 	previousConnectionsState = newConnectionsState

	// 	const newResult = isUpstreamNodePlaying(state, nodeId)

	// 	previousResult = newResult

	// 	return newResult
	// }
}

function isUpstreamNodePlaying(
	state: IClientRoomState, nodeId: string, processedNodeIds = Set<string>(),
): boolean {
	if (processedNodeIds.includes(nodeId)) return false

	return selectConnectionsWithTargetIds(state, [nodeId])
		.some(connection => {
			return getConnectionNodeInfo(connection.sourceType)
				.selectIsPlaying(state, connection.sourceId, processedNodeIds.add(nodeId))
		})
}
