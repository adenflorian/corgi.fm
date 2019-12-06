import * as Immutable from 'immutable'
import {ExpConnectionType} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import {ExpNodeAudioOutputPort, ExpNodeAudioInputPort, ExpPort} from './ExpPorts'
import {ExpMidiOutputPort, ExpMidiInputPort, MidiReceiver} from './ExpMidiPorts'
import {ExpPolyphonicOutputPort, ExpPolyphonicInputPort} from './ExpPolyphonicPorts'
import {BooleanChangedEvent} from './CorgiEvents'

export type ExpConnectionCallback = (connection: ExpNodeConnectionReact) => void

export interface ExpNodeConnectionReact extends Pick<ExpNodeConnection, 'id' | 'outputPort' | 'inputPort'> {}

// Different connection types could have different functions for sending data across
export abstract class ExpNodeConnection {
	public readonly feedbackLoopDetected = new BooleanChangedEvent(false)
	protected abstract _source: ExpPort
	protected abstract _target: ExpPort

	public constructor(
		public readonly id: Id,
		public readonly type: ExpConnectionType,
	) {}

	public abstract dispose(): void
	public abstract get outputPort(): ExpPort
	public abstract get inputPort(): ExpPort

	public detectFeedbackLoop(i: number, nodeIds: Immutable.List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

const emptyMap = Immutable.Map<any, any>()

export class ExpNodeAudioConnection extends ExpNodeConnection {
	private _audioVoiceConnections = new AudioVoiceConnections(this.id, emptyMap)

	public constructor(
		public readonly id: Id,
		protected _source: ExpNodeAudioOutputPort,
		protected _target: ExpNodeAudioInputPort,
	) {
		super(id, 'audio')
		this._source.connect(this)
		this._target.connect(this)
		this._subscribeToSources()
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public changeSource(newSource: ExpNodeAudioOutputPort) {
		this._audioVoiceConnections.dispose()
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)
		this._subscribeToSources()
	}

	public changeTarget(newTarget: ExpNodeAudioInputPort) {
		this._audioVoiceConnections.dispose()
		this._target.disconnect(this)
		this._target = newTarget
		this._target.connect(this)
		this._subscribeToSources()
	}

	private _subscribeToSources() {
		this._source.getSources(this.id).subscribe(this._foo)
	}

	private readonly _foo = (sources: Immutable.Map<Id, AudioNode>) => {
		console.log('foo 1', {sources: sources.toJS()})
		const pairs = this._target.pairSourcesWithTargets(this.id, sources)
		this._audioVoiceConnections.dispose()
		this._audioVoiceConnections = new AudioVoiceConnections(this.id, pairs)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())

		if (!this.feedbackLoopDetected.current) {
			console.log('foo 2', {_audioVoiceConnections: this._audioVoiceConnections})
			this._audioVoiceConnections.connect()
		}
	}

	public dispose() {
		this._source.getSources(this.id).unsubscribe(this._foo)
		// Give some time for the nodes to fade out audio
		setTimeout(() => {
			this._audioVoiceConnections.dispose()
			this._source.disconnect(this)
			this._target.disconnect(this)
		}, 100)
	}
}

export interface SourceTargetPair {
	readonly id: Id
	readonly source: AudioNode
	readonly target: AudioNode | AudioParam
}

export type SourceTargetPairs = Immutable.Map<Id, SourceTargetPair>

export type PairSourcesWithTargets = (sources: Immutable.Map<Id, AudioNode>) => SourceTargetPairs

class AudioVoiceConnections {
	public get isConnected() {return this._isConnected}
	private readonly _voiceConnections = new Map<Id, AudioVoiceConnection>()
	private _isConnected = false

	public constructor(
		public readonly id: Id,
		sourceTargetPairs: SourceTargetPairs,
	) {
		sourceTargetPairs.forEach(pair => {
			this._voiceConnections.set(pair.id, new AudioVoiceConnection(pair.id, pair.source, pair.target))
		})
	}

	public connect() {
		if (this._isConnected) return
		this._voiceConnections.forEach(x => x.connect())
		this._isConnected = true
	}

	// public disconnect() {
	// 	if (!this._isConnected) return
	// 	this._voiceConnections.forEach(x => x.disconnect())
	// 	this._isConnected = false
	// }

	// public changeSource(newSources: Immutable.Map<Id, AudioNode>) {
	// 	this._voiceConnections.forEach(x => x.changeSource(newSource))
	// }

	// public changeTarget(newTarget: AudioNode | AudioParam) {
	// 	this._voiceConnections.forEach(x => x.changeTarget(newTarget))
	// }

	public dispose() {
		this._voiceConnections.forEach(x => x.dispose())
	}
}

class AudioVoiceConnection {
	public get isConnected() {return this._isConnected}
	private _isConnected = false

	public constructor(
		public readonly id: Id,
		protected _source: AudioNode,
		protected _target: AudioNode | AudioParam,
	) {}

	public connect() {
		if (this._isConnected) return
		this._source.connect(this._target as AudioNode)
		this._isConnected = true
	}

	private disconnect() {
		if (!this._isConnected) return
		try {
			this._source.disconnect(this._target as AudioNode)
		} catch (error) {
			// Safe to ignore I think, the source node will probably have already disconnected the actual source already
			// logger.warn('[AudioVoiceConnection.disconnect] error while disconnecting: ', {error, id: this.id, source: this._source, target: this._target})
		}
		this._isConnected = false
	}

	// public changeSource(newSource: AudioNode) {
	// 	this.disconnect()
	// 	this._source = newSource
	// 	this.connect()
	// }

	// public changeTarget(newTarget: AudioNode | AudioParam) {
	// 	this.disconnect()
	// 	this._target = newTarget
	// 	this.connect()
	// }

	public dispose() {
		this.disconnect()
	}
}

// Different connection types could have different functions for sending data across
export class ExpMidiConnection extends ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		protected _source: ExpMidiOutputPort,
		protected _target: ExpMidiInputPort,
	) {
		super(id, 'midi')
		this._source.connect(this)
		this._target.connect(this)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public sendMidiAction: MidiReceiver = (...args) => {
		if (this.feedbackLoopDetected.current) return
		this._target.destination(...args)
	}

	public changeSource(newSource: ExpMidiOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public changeTarget(newTarget: ExpMidiInputPort) {
		const oldTarget = this._target
		this._target = newTarget
		oldTarget.disconnect(this)
		newTarget.connect(this)
		this._source.changeTarget(oldTarget, newTarget)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public dispose() {
		this._source.disconnect(this)
		this._target.disconnect(this)
	}
}

// Different connection types could have different functions for sending data across
export class ExpPolyphonicConnection extends ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		protected _source: ExpPolyphonicOutputPort,
		protected _target: ExpPolyphonicInputPort,
	) {
		super(id, 'polyphonic')
		this._target.connect(this)
		this._source.connect(this)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public changeSource(newSource: ExpPolyphonicOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public changeTarget(newTarget: ExpPolyphonicInputPort) {
		const oldTarget = this._target
		this._target = newTarget
		oldTarget.disconnect(this)
		newTarget.connect(this)
		this._source.changeTarget(oldTarget, newTarget)

		this.feedbackLoopDetected.invokeImmediately(this._source.detectFeedbackLoop())
	}

	public dispose() {
		this._source.disconnect(this)
		this._target.disconnect(this)
	}
}

export type ExpNodeConnections = Map<Id, ExpNodeConnection>
export type ExpNodeAudioConnections = Map<Id, ExpNodeAudioConnection>
export type ExpMidiConnections = Map<Id, ExpMidiConnection>
export type ExpPolyphonicConnections = Map<Id, ExpPolyphonicConnection>

export function isAudioConnection(val: unknown): val is ExpNodeAudioConnection {
	return val instanceof ExpNodeAudioConnection
}

export function isMidiConnection(val: unknown): val is ExpMidiConnection {
	return val instanceof ExpMidiConnection
}

export function isPolyphonicConnection(val: unknown): val is ExpPolyphonicConnection {
	return val instanceof ExpPolyphonicConnection
}
