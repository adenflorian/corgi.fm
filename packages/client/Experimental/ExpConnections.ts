import {List} from 'immutable'
import {ExpConnectionType} from '@corgifm/common/redux'
import {ExpNodeAudioOutputPort, ExpNodeAudioInputPort, ExpPort} from './ExpPorts'
import {ExpMidiOutputPort, ExpMidiInputPort} from './ExpMidiPorts'
import {ExpPolyphonicOutputPort, ExpPolyphonicInputPort} from './ExpPolyphonicPorts'

export type ExpConnectionCallback = (connection: ExpNodeConnectionReact) => void

export interface ExpNodeConnectionReact extends Pick<ExpNodeConnection, 'id' | 'outputPort' | 'inputPort'> {}

// Different connection types could have different functions for sending data across
export abstract class ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		public readonly type: ExpConnectionType,
	) {}

	public abstract dispose(): void
	public abstract detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean
	public abstract get outputPort(): ExpPort
	public abstract get inputPort(): ExpPort
}

// Different connection types could have different functions for sending data across
export class ExpNodeAudioConnection extends ExpNodeConnection {
	private _actualTargetNode: AudioNode | AudioParam

	public constructor(
		public readonly id: Id,
		private _source: ExpNodeAudioOutputPort,
		private _target: ExpNodeAudioInputPort,
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

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

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

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

// Different connection types could have different functions for sending data across
export class ExpMidiConnection extends ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpMidiOutputPort,
		private _target: ExpMidiInputPort,
	) {
		super(id, 'midi')
		this._source.connect(this)
		this._target.connect(this)
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public changeSource(newSource: ExpMidiOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)
	}

	public changeTarget(newTarget: ExpMidiInputPort) {
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

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

// Different connection types could have different functions for sending data across
export class ExpPolyphonicConnection extends ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpPolyphonicOutputPort,
		private _target: ExpPolyphonicInputPort,
	) {
		super(id, 'polyphonic')
		this._source.connect(this)
		this._target.connect(this)
	}

	public get outputPort() {return this._source}
	public get inputPort() {return this._target}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

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

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
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
