import {Map, Record, Set} from 'immutable'
import {AnyAction} from 'redux'
import {serverClientId} from '../common-constants'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {CssColor} from '../shamu-color'
import {
	basicSamplerActions, addBasicSynthesizer, addSimpleDelay, BasicSamplerState,
	BasicSynthesizerState, deserializeBasicSamplerState,
	deserializeBasicSynthesizerState, addVirtualKeyboard,
	deserializeSimpleDelayState, IClientRoomState,
	makeGetKeyboardMidiOutput, selectBasicSynthesizer,
	selectGlobalClockIsPlaying, selectGridSequencer,
	selectGridSequencerActiveNotes, selectGridSequencerIsActive,
	selectGridSequencerIsSending, selectInfiniteSequencer,
	selectInfiniteSequencerActiveNotes, selectInfiniteSequencerIsActive,
	selectInfiniteSequencerIsSending, selectSampler,
	selectSimpleDelay, selectSimpleReverb, selectVirtualKeyboardById,
	selectVirtualKeyboardHasPressedKeys, SimpleDelayState, VirtualKeyboardState,
	BetterSequencerState, addBetterSequencer, selectBetterSequencer,
	selectBetterSequencerIsActive, selectBetterSequencerIsSending,
	deserializeBetterSequencerState,
	addSimpleReverb, deserializeSimpleReverbState, SimpleReverbState,
	addSimpleCompressor, deserializeSimpleCompressorState, selectSimpleCompressor, SimpleCompressorState,
	selectSequencerIsPlaying, sequencerActions,
	addInfiniteSequencer, deserializeInfiniteSequencerState, InfiniteSequencerState,
	addGroupSequencer, deserializeGroupSequencerState, GroupSequencer, selectGroupSequencer,
	addGridSequencer, deserializeGridSequencerState, GridSequencerState,
	selectConnectionsWithTargetIds, IClientAppState,
} from '.'

export const MASTER_AUDIO_OUTPUT_TARGET_ID = 'MASTER_AUDIO_OUTPUT_TARGET_ID'

export const MASTER_CLOCK_SOURCE_ID = 'MASTER_CLOCK_SOURCE_ID'

export type IConnectionNodeInfo = ReturnType<typeof makeNodeInfo>

export const dummyIConnectable: IMultiStateThing = {
	color: CssColor.disabledGray,
	id: 'oh no',
	type: ConnectionNodeType.dummy,
	name: 'default node name',
	enabled: false,
	ownerId: 'dummyOwnerId',
}

class DummyConnectable implements IConnectable {
	public constructor(
		public readonly color = CssColor.disabledGray,
		public readonly id: Id = 'oh no',
		public readonly type = ConnectionNodeType.dummy,
		public readonly name = 'default node name',
		public readonly enabled = false,
	) {}
}

const _makeNodeInfo = Record({
	stateSelector: ((roomState: IClientRoomState, id: Id) => dummyIConnectable),
	selectIsActive: (() => null) as (roomState: IClientRoomState, id: Id) => boolean | null,
	selectIsSending: (() => null) as (roomState: IClientRoomState, id: Id) => boolean | null,
	selectIsPlaying: (() => false) as (roomState: IClientRoomState, id: Id, processedIds?: Set<Id>) => boolean,
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
	canHaveKeyboardConnectedToIt: false,
	defaultWidth: 162,
	defaultHeight: 100,
	notesDisplayStartX: 0,
	notesDisplayWidth: 0,
	isResizable: false,
})

type NodeInfo = ReturnType<typeof _makeNodeInfo>

function makeNodeInfo(x: Pick<NodeInfo, 'stateSelector' | 'typeName' | 'StateConstructor' | 'addNodeActionCreator'> & Partial<NodeInfo>) {
	return _makeNodeInfo(x)
}

class AudioOutputState implements IMultiStateThing {
	public readonly id = MASTER_AUDIO_OUTPUT_TARGET_ID
	public readonly color = CssColor.green
	public readonly type = ConnectionNodeType.audioOutput
	public readonly name = 'audio output'
	public readonly enabled = true
	public readonly ownerId = serverClientId
}

const audioOutputState = new AudioOutputState()

class MasterClockState implements IMultiStateThing {
	public readonly id = MASTER_CLOCK_SOURCE_ID
	public readonly color = CssColor.brightBlue
	public readonly type = ConnectionNodeType.masterClock
	public readonly name = 'master clock'
	public readonly enabled = true
	public readonly ownerId = serverClientId
}

const masterClockState = new MasterClockState()

const sequencerDisabledText = 'Will stop emitting notes'
const instrumentDisabledText = 'Will stop emitting audio'
const effectDisabledText = 'Will let audio pass through unaltered'

type NodeInfoMap = {
	[key in ConnectionNodeType]: NodeInfo
}

export const getNodeInfo = () => nodeInfo

const nodeInfo: NodeInfoMap = {
	dummy: _makeNodeInfo(),
	virtualKeyboard: makeNodeInfo({
		type: ConnectionNodeType.virtualKeyboard,
		typeName: 'Virtual Keyboard',
		StateConstructor: VirtualKeyboardState,
		addNodeActionCreator: addVirtualKeyboard,
		stateSelector: selectVirtualKeyboardById,
		selectIsActive: selectVirtualKeyboardHasPressedKeys,
		selectIsSending: selectVirtualKeyboardHasPressedKeys,
		selectIsPlaying: selectVirtualKeyboardHasPressedKeys,
		stateDeserializer: VirtualKeyboardState.fromJS,
		showOnAddNodeMenu: true,
		isDeletable: true,
		disabledText: 'Will stop emitting notes',
		defaultWidth: 456,
		defaultHeight: 56,
	}),
	gridSequencer: makeNodeInfo({
		type: ConnectionNodeType.gridSequencer,
		typeName: 'Grid Sequencer',
		StateConstructor: GridSequencerState,
		addNodeActionCreator: addGridSequencer,
		stateSelector: selectGridSequencer,
		selectIsActive: selectGridSequencerIsActive,
		selectIsSending: selectGridSequencerIsSending,
		selectIsPlaying: selectSequencerIsPlaying,
		stateDeserializer: deserializeGridSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
		undoAction: id => sequencerActions.undo(id),
		disabledText: sequencerDisabledText,
		isNodeCloneable: true,
		canHaveKeyboardConnectedToIt: true,
		defaultWidth: GridSequencerState.getWidth,
		defaultHeight: GridSequencerState.getHeight,
		notesDisplayStartX: GridSequencerState.notesStartX,
		notesDisplayWidth: GridSequencerState.notesDisplayWidth,
	}),
	betterSequencer: makeNodeInfo({
		type: ConnectionNodeType.betterSequencer,
		typeName: 'Better Sequencer',
		StateConstructor: BetterSequencerState,
		addNodeActionCreator: addBetterSequencer,
		stateSelector: selectBetterSequencer,
		selectIsActive: selectBetterSequencerIsActive,
		selectIsSending: selectBetterSequencerIsSending,
		selectIsPlaying: selectSequencerIsPlaying,
		stateDeserializer: deserializeBetterSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
		undoAction: id => sequencerActions.undo(id),
		disabledText: sequencerDisabledText,
		isNodeCloneable: true,
		canHaveKeyboardConnectedToIt: true,
		defaultWidth: 688,
		defaultHeight: 88 * 4,
		notesDisplayStartX: 64,
		notesDisplayWidth: 688 - 64,
		isResizable: true,
	}),
	infiniteSequencer: makeNodeInfo({
		type: ConnectionNodeType.infiniteSequencer,
		typeName: 'Infinite Sequencer',
		StateConstructor: InfiniteSequencerState,
		addNodeActionCreator: addInfiniteSequencer,
		stateSelector: selectInfiniteSequencer,
		selectIsActive: selectInfiniteSequencerIsActive,
		selectIsSending: selectInfiniteSequencerIsSending,
		selectIsPlaying: selectSequencerIsPlaying,
		stateDeserializer: deserializeInfiniteSequencerState,
		showOnAddNodeMenu: true,
		isDeletable: true,
		autoConnectToClock: true,
		undoAction: id => sequencerActions.undo(id),
		disabledText: sequencerDisabledText,
		isNodeCloneable: true,
		canHaveKeyboardConnectedToIt: true,
		defaultWidth: InfiniteSequencerState.defaultWidth,
		defaultHeight: InfiniteSequencerState.defaultHeight,
		notesDisplayStartX: InfiniteSequencerState.notesStartX,
		notesDisplayWidth: InfiniteSequencerState.notesWidth,
	}),
	groupSequencer: makeNodeInfo({
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
		defaultWidth: 800,
		defaultHeight: 200,
		notesDisplayStartX: 0,
		notesDisplayWidth: 800,
	}),
	basicSynthesizer: makeNodeInfo({
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
		canHaveKeyboardConnectedToIt: true,
		defaultWidth: 64 * 5,
		defaultHeight: 56 + (88 * 3),
	}),
	basicSampler: makeNodeInfo({
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
		canHaveKeyboardConnectedToIt: true,
		defaultWidth: 64 + 320 + (64 * 5),
		defaultHeight: 88 * 2,
	}),
	simpleReverb: makeNodeInfo({
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
		defaultWidth: 64 * 7,
		defaultHeight: 88,
	}),
	simpleCompressor: makeNodeInfo({
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
		defaultWidth: 64 * 5,
		defaultHeight: 88,
	}),
	simpleDelay: makeNodeInfo({
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
		defaultWidth: 80 * 3,
		defaultHeight: 88,
	}),
	audioOutput: makeNodeInfo({
		type: ConnectionNodeType.audioOutput,
		typeName: 'Audio Output',
		StateConstructor: AudioOutputState,
		addNodeActionCreator: () => ({type: 'dummy audioOutput type'}),
		selectIsPlaying: selectIsUpstreamNodePlaying,
		stateSelector: () => audioOutputState,
		disabledText: 'Will mute for you only',
		defaultWidth: 64 * 2,
		defaultHeight: 88,
	}),
	masterClock: makeNodeInfo({
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
		defaultWidth: 172,
		defaultHeight: 88,
	}),
} as const

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

export const findNodeInfo = (type: ConnectionNodeType): IConnectionNodeInfo => {
	return nodeInfo[type] || dummyNodeInfo
}

export function getAddableNodeInfos() {
	return Map(nodeInfo).filter(x => x.showOnAddNodeMenu)
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
			return findNodeInfo(connection.sourceType)
				.selectIsPlaying(state, connection.sourceId, processedNodeIds.add(nodeId))
		})
}
