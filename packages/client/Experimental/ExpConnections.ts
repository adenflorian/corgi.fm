import {List} from 'immutable'
import {ExpConnectionType} from '@corgifm/common/redux'
import {ExpNodeAudioOutputPort, ExpNodeAudioInputPort, ExpPort} from './ExpPorts'
import {ExpGateOutputPort, ExpGateInputPort} from './ExpGatePorts'

export type ExpConnectionCallback = (connection: ExpNodeConnectionReact) => void

export interface ExpNodeConnectionReact extends Pick<ExpNodeConnection, 'id' | 'outputPort' | 'inputPort'> {}

// Different connection types could have different functions for sending data across
export abstract class ExpNodeConnection {
	public readonly subscribers = new Map<ExpConnectionCallback, ExpConnectionCallback>()

	public constructor(
		public readonly id: Id,
		public readonly type: ExpConnectionType,
	) {}

	public abstract dispose(): void
	public abstract detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean
	public abstract get outputPort(): ExpPort
	public abstract get inputPort(): ExpPort

	public onPortUpdated(port: ExpPort) {
		this.subscribers.forEach(x => x(this))
	}
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

		this._actualTargetNode = this._target.prepareDestinationForConnection(this.id, this._source.signalRange)

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
		this._actualTargetNode = this._target.prepareDestinationForConnection(this.id, this._source.signalRange)
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
export class ExpGateConnection extends ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpGateOutputPort,
		private _target: ExpGateInputPort,
	) {
		super(id, 'gate')
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

	public changeSource(newSource: ExpGateOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)
	}

	public changeTarget(newTarget: ExpGateInputPort) {
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
export type ExpGateConnections = Map<Id, ExpGateConnection>

export function isAudioConnection(val: unknown): val is ExpNodeAudioConnection {
	return val instanceof ExpNodeAudioConnection
}

export function isGateConnection(val: unknown): val is ExpGateConnection {
	return val instanceof ExpGateConnection
}
