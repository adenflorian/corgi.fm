import {Map, Record, Set} from 'immutable'
import {AnyAction} from 'redux'
import {serverClientId} from '../common-constants'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {IClientAppState} from './common-redux-types'
import {selectConnectionsWithTargetIds} from './connections-redux'
import {addGridSequencer, deserializeGridSequencerState, GridSequencerState} from './grid-sequencers-redux'
import {addGroupSequencer, deserializeGroupSequencerState, GroupSequencer, selectGroupSequencer} from './group-sequencers-redux'
import {addInfiniteSequencer, deserializeInfiniteSequencerState, InfiniteSequencerState} from './infinite-sequencers-redux'
import {selectSequencerIsPlaying, sequencerActions} from './sequencer-redux'
import {addSimpleCompressor, deserializeSimpleCompressorState, selectSimpleCompressor, SimpleCompressorState} from './simple-compressor-redux'
import {addSimpleReverb, deserializeSimpleReverbState, SimpleReverbState} from './simple-reverb-redux'
import {addVirtualKeyboard} from './virtual-keyboard-redux'
import {
	basicSamplerActions, addBasicSynthesizer,
	addSimpleDelay, BasicSamplerState,
	BasicSynthesizerState, deserializeBasicSamplerState,
	deserializeBasicSynthesizerState,
	deserializeSimpleDelayState, IClientRoomState,
	makeGetKeyboardMidiOutput, selectBasicSynthesizer,
	selectGlobalClockIsPlaying, selectGridSequencer,
	selectGridSequencerActiveNotes, selectGridSequencerIsActive,
	selectGridSequencerIsSending, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive, selectInfiniteSequencerIsSending, selectSampler,
	selectSimpleDelay, selectSimpleReverb, selectVirtualKeyboardById, selectVirtualKeyboardHasPressedKeys, SimpleDelayState, VirtualKeyboardState,
} from '.'

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export type IConnectionNodeInfo = ReturnType<typeof makeNodeInfo>

export const dummyIConnectable: IMultiStateThing = {
	color: CssColor.disabledGray,
	id: 'oh no',
	type: ConnectionNodeType.dummy,
	width: 0,
	height: 0,
	name: 'default node name',
	enabled: false,
	ownerId: 'dummyOwnerId',
}

class DummyConnectable implements IConnectable {
	public constructor(
		public readonly color = CssColor.disabledGray,
		public readonly id: Id = 'oh no',
		public readonly type = ConnectionNodeType.dummy,
		public readonly width = 0,
		public readonly height = 0,
		public readonly name = 'default node name',
		public readonly enabled = false,
	) {}
}

const _makeNodeInfo = Record({
	stateSelector: ((roomState: IClientRoomState, id: Id) => dummyIConnectable),
	selectIsActive: (() => null) as (roomState: IClientRoomState, id: Id) => boolean | null,
	selectIsSending: (() => null) as (roomState: IClientRoomState, id: Id) => boolean | null,
	selectIsPlaying: (() => false) as (roomState: IClientRoomState, id: Id, processedIds?: Set<Id>) => boolean,
	selectActiveNotes: (_: IClientRoomState, __: Id) => Set<IMidiNote>(),
	stateDeserializer: ((state: IMultiStateThing) => state) as (state: IMultiStateThing) => IMultiStateThing,
	color: false as string | false,
	typeName: 'Default Type Name',
	StateConstructor: (DummyConnectable) as new (ownerId: Id) => IConnectable,
	addNodeActionCreator: ((state: IClientAppState) => ({type: 'dummy add node action type'})) as (state: any) => AnyAction,
	showOnAddNodeMenu: false,
	isDeletable: false,
	autoConnectToClock: false,
	autoConnectToAudioOutput: false,
	undoAction: ((id: Id) => undefined) as (id: Id) => AnyAction | undefined,
	disabledText: '',
	isNodeCloneable: false,
	type: ConnectionNodeType.dummy,
})

type NodeInfo = ReturnType<typeof _makeNodeInfo>

function makeNodeInfo(x: Pick<NodeInfo, 'stateSelector' | 'typeName' | 'StateConstructor' | 'addNodeActionCreator'> & Partial<NodeInfo>) {
	return _makeNodeInfo(x)
}

class AudioOutputState implements IMultiStateThing {
	public readonly id = MASTER_AUDIO_OUTPUT_TARGET_ID
	public readonly color = CssColor.green
	public readonly type = ConnectionNodeType.audioOutput
	public readonly width = 64 * 2
	public readonly height = 88
	public readonly name = 'audio output'
	public readonly enabled = true
	public readonly ownerId = serverClientId
}

const audioOutputState = new AudioOutputState()

class MasterClockState implements IMultiStateThing {
	public readonly id = MASTER_CLOCK_SOURCE_ID
	public readonly color = CssColor.brightBlue
	public readonly type = ConnectionNodeType.masterClock
	public readonly width = 172
	public readonly height = 88
	public readonly name = 'master clock'
	public readonly enabled = true
	public readonly ownerId = serverClientId
}

const masterClockState = new MasterClockState()

const sequencerDisabledText = 'Will stop emitting notes'
const instrumentDisabledText = 'Will stop emitting audio'
const effectDisabledText = 'Will let audio pass through unaltered'

const NodeInfoMap = Map<ConnectionNodeType, NodeInfo>([
	[ConnectionNodeType.virtualKeyboard, makeNodeInfo({
		type: ConnectionNodeType.virtualKeyboard,
		typeName: 'Virtual Keyboard',
		StateConstructor: VirtualKeyboardState,
		addNodeActionCreator: addVirtualKeyboard,
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardHasPressedKeys,
		selectIsSending: selectVirtualKeyboardHasPressedKeys,
		selectIsPlaying: selectVirtualKeyboardHasPressedKeys,
		selectActiveNotes: makeGetKeyboardMidiOutput(),
		stateDeserializer: VirtualKeyboardState.fromJS,
		showOnAddNodeMenu: true,
		isDeletable: true,
		disabledText: 'Will stop emitting notes',
	})],
	[ConnectionNodeType.gridSequencer, makeNodeInfo({
		type: ConnectionNodeType.gridSequencer,
		typeName: 'Grid Sequencer',
		StateConstructor: GridSequencerState,
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
		undoAction: id => sequencerActions.undo(id),
		disabledText: sequencerDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.infiniteSequencer, makeNodeInfo({
		type: ConnectionNodeType.infiniteSequencer,
		typeName: 'Infinite Sequencer',
		StateConstructor: InfiniteSequencerState,
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
		undoAction: id => sequencerActions.undo(id),
		disabledText: sequencerDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.groupSequencer, makeNodeInfo({
		type: ConnectionNodeType.groupSequencer,
		typeName: 'Group Sequencer',
		StateConstructor: GroupSequencer,
		addNodeActionCreator: addGroupSequencer,
		stateSelector: selectGroupSequencer,
		stateDeserializer: deserializeGroupSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
		disabledText: 'Will prevent connected nodes from playing, unless they are connected to a different, enabled group sequencer',
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.basicSynthesizer, makeNodeInfo({
		type: ConnectionNodeType.basicSynthesizer,
		typeName: 'Basic Synthesizer',
		StateConstructor: BasicSynthesizerState,
		addNodeActionCreator: addBasicSynthesizer,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectBasicSynthesizer,
		stateDeserializer: deserializeBasicSynthesizerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
		disabledText: instrumentDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.basicSampler, makeNodeInfo({
		type: ConnectionNodeType.basicSampler,
		typeName: 'Custom Sampler',
		StateConstructor: BasicSamplerState,
		addNodeActionCreator: basicSamplerActions.add,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSampler,
		stateDeserializer: deserializeBasicSamplerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
		disabledText: instrumentDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.simpleReverb, makeNodeInfo({
		type: ConnectionNodeType.simpleReverb,
		typeName: 'Reverb',
		StateConstructor: SimpleReverbState,
		addNodeActionCreator: addSimpleReverb,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSimpleReverb,
		stateDeserializer: deserializeSimpleReverbState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
		disabledText: effectDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.simpleCompressor, makeNodeInfo({
		type: ConnectionNodeType.simpleCompressor,
		typeName: 'Compressor',
		StateConstructor: SimpleCompressorState,
		addNodeActionCreator: addSimpleCompressor,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSimpleCompressor,
		stateDeserializer: deserializeSimpleCompressorState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
		disabledText: effectDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.simpleDelay, makeNodeInfo({
		type: ConnectionNodeType.simpleDelay,
		typeName: 'Delay',
		StateConstructor: SimpleDelayState,
		addNodeActionCreator: addSimpleDelay,
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: selectSimpleDelay,
		stateDeserializer: deserializeSimpleDelayState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToAudioOutput: true,
		disabledText: effectDisabledText,
		isNodeCloneable: true,
	})],
	[ConnectionNodeType.audioOutput, makeNodeInfo({
		type: ConnectionNodeType.audioOutput,
		typeName: 'Audio Output',
		StateConstructor: AudioOutputState,
		addNodeActionCreator: () => ({type: 'dummy audioOutput type'}),
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: () => audioOutputState,
		disabledText: 'Will mute for you only',
	})],
	[ConnectionNodeType.masterClock, makeNodeInfo({
		type: ConnectionNodeType.masterClock,
		typeName: 'Master Clock',
		StateConstructor: MasterClockState,
		addNodeActionCreator: () => ({type: 'dummy masterClock type'}),
		stateSelector: () => masterClockState,
		selectIsActive: selectGlobalClockIsPlaying,
		selectIsSending: selectGlobalClockIsPlaying,
		selectIsPlaying: selectGlobalClockIsPlaying,
		color: CssColor.brightBlue,
		disabledText: 'Will stop ticking',
	})],
])

export function isAudioNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.basicSynthesizer,
		ConnectionNodeType.basicSampler,
		ConnectionNodeType.audioOutput,
		ConnectionNodeType.simpleReverb,
		ConnectionNodeType.simpleCompressor,
		ConnectionNodeType.simpleDelay,
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
function selectIsUpstreamNodePlaying(state: IClientRoomState, id: Id, processedNodeIds = Set<Id>()): boolean {
	return memoizedIsUpstreamNodePlaying(state, id, processedNodeIds)
}

function memoizedIsUpstreamNodePlaying(state: IClientRoomState, nodeId: Id, processedNodeIds: Set<Id>) {
	return isUpstreamNodePlaying(state, nodeId, processedNodeIds)
}

function isUpstreamNodePlaying(
	state: IClientRoomState, nodeId: Id, processedNodeIds = Set<Id>(),
): boolean {
	if (processedNodeIds.includes(nodeId)) return false

	return selectConnectionsWithTargetIds(state, [nodeId])
		.some(connection => {
			return getConnectionNodeInfo(connection.sourceType)
				.selectIsPlaying(state, connection.sourceId, processedNodeIds.add(nodeId))
		})
}
