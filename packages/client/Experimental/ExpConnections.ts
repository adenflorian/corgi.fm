import {List} from 'immutable'
import {ExpConnectionType} from '@corgifm/common/redux'
import {ExpNodeAudioOutputPort, ExpNodeAudioInputPort, ExpPort} from './ExpPorts'
import {ExpMidiOutputPort, ExpMidiInputPort, MidiReceiver} from './ExpMidiPorts'
import {ExpPolyphonicOutputPort, ExpPolyphonicInputPort} from './ExpPolyphonicPorts'
import {logger} from '../client-logger'
import {CorgiObjectChangedEvent, BooleanChangedEvent} from './CorgiEvents'

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

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

// Different connection types could have different functions for sending data across
export class ExpNodeAudioConnection extends ExpNodeConnection {
	private _actualTargetNode: AudioNode | AudioParam

	public constructor(
		public readonly id: Id,
		protected _source: ExpNodeAudioOutputPort,
		protected _target: ExpNodeAudioInputPort,
	) {
		super(id, 'audio')
		this._source.connect(this)
		this._target.connect(this)

		this._actualTargetNode = this._target.prepareDestinationForConnection(this.id)

		if (this._source.detectFeedbackLoop()) return

		this._source.getSource(this.id).connect(this._actualTargetNode as AudioNode)
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public changeSource(newSource: ExpNodeAudioOutputPort) {
		this._source.disconnect(this, this._actualTargetNode as AudioNode)
		this._source = newSource
		this._source.connect(this)
		this._source.getSource(this.id).connect(this._actualTargetNode as AudioNode)
	}

	public changeTarget(newTarget: ExpNodeAudioInputPort) {
		const oldActualTarget = this._actualTargetNode
		const oldTarget = this._target
		this._target = newTarget
		oldTarget.disconnect(this, this._actualTargetNode as AudioNode)
		newTarget.connect(this)
		this._actualTargetNode = this._target.prepareDestinationForConnection(this.id)
		this._source.changeTarget(oldActualTarget as AudioNode, this._actualTargetNode as AudioNode)
	}

	public dispose() {
		// Give some time for the nodes to fade out audio
		setTimeout(() => {
			this._source.disconnect(this, this._actualTargetNode as AudioNode)
			this._target.disconnect(this, this._actualTargetNode as AudioNode)
		}, 100)
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
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public changeSource(newSource: ExpPolyphonicOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)
	}

	public changeTarget(newTarget: ExpPolyphonicInputPort) {
		const oldTarget = this._target
		this._target = newTarget
		oldTarget.disconnect(this)
		newTarget.connect(this)
		this._source.changeTarget(oldTarget, newTarget)
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
