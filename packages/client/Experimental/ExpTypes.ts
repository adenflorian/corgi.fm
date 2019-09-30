import {CorgiNode} from './CorgiNode';
import {logger} from '../client-logger';

/* eslint-disable no-empty-function */
export type ExpAudioParams = Map<Id, ExpAudioParam>

export function buildAudioParamDesc(
	...args: Parameters<typeof foo>
): [Id, ExpAudioParam] {
	return [args[0], foo(...args)]
}

function foo(
	id: Id, audioParam: AudioParam,
	defaultValue: number, min: number, max: number,
	curve = 1, valueString?: (v: number) => string,
) {
	return {
		id,
		audioParam,
		min,
		max,
		default: defaultValue,
		reactSubscribers: new Map<AudioParamCallback, AudioParamCallback>(),
		curve,
		valueString,
	}
}

export interface ExpAudioParam extends ReturnType<typeof foo> {}

export type AudioParamCallback = (newValue: number) => void

export interface AudioParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: number
}

export interface ParamDescriptor {
	readonly paramId: Id
	readonly type: ExpParamType
}

// Different connection types could have different functions for sending data across
export class ExpNodeConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpNodeAudioPort,
		private _target: ExpNodeAudioPort,
	) {}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public connectSource(source: ExpNodeAudioPort) {
		this._source = source
	}

	public connectTarget(target: ExpNodeAudioPort) {
		this._target = target
	}
}

// Different connection types could have different functions for sending data across
export class ExpNodeAudioConnection {
	public constructor(
		public readonly id: Id,
		private _source: ExpNodeAudioOutputPort,
		private _target: ExpNodeAudioInputPort,
	) {
		this._source.connect(this)
		this._target.connect(this)
	}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public changeSource(newSource: ExpNodeAudioOutputPort) {
		this._source.disconnect(this)
		this._source = newSource
		this._source.connect(this)
	}

	public changeTarget(newTarget: ExpNodeAudioInputPort) {
		this._source.changeTarget(this._target, newTarget)
		this._target.disconnect(this)
		this._target = newTarget
		this._target.connect(this)
	}

	public dispose() {
		this._source.disconnect(this)
		this._target.disconnect(this)
	}

	public detectFeedbackLoop(i: number, nodeIds: Id[]): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

export type ExpNodeAudioConnections = Map<Id, ExpNodeAudioConnection>

export abstract class ExpNodeAudioPort {
	protected readonly _connections: ExpNodeAudioConnections = new Map<Id, ExpNodeAudioConnection>()

	public constructor(
		public readonly id: number,
		public readonly name: string,
		protected readonly _node: CorgiNode,
	) {}

	public connect = (connection: ExpNodeAudioConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
	}

	public disconnect = (connection: ExpNodeAudioConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
	}

	protected abstract _connect(connection: ExpNodeAudioConnection): void
	protected abstract _disconnect(connection: ExpNodeAudioConnection): void
}

export interface ExpNodeAudioInputPortArgs {
	readonly id: number
	readonly name: string
	readonly destination: AudioNode | AudioParam
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		protected readonly _node: CorgiNode,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name, _node)
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
	}

	public detectFeedbackLoop(i: number, nodeIds: Id[]): boolean {
		return this._node.detectFeedbackLoop(i, nodeIds)
	}
}

export interface ExpNodeAudioOutputPortArgs {
	readonly id: number
	readonly name: string
	readonly source: AudioNode
}

export class ExpNodeAudioOutputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		protected readonly _node: CorgiNode,
		public readonly source: AudioNode
	) {
		super(id, name, _node)
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {
		if (!this.detectFeedbackLoop()) {
			this.source.connect(connection.getTarget().destination as AudioNode)
		}
	}

	public changeTarget = (oldTarget: ExpNodeAudioInputPort, newTarget: ExpNodeAudioInputPort) => {
		this.source.disconnect(oldTarget.destination as AudioNode)
		if (!this.detectFeedbackLoop()) {
			this.source.connect(newTarget.destination as AudioNode)
		}
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		this.source.disconnect(connection.getTarget().destination as AudioNode)
	}

	public detectFeedbackLoop(i = 0, nodeIds: Id[] = []): boolean {
		if (nodeIds.includes(this._node.id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this._node.id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this._node.id, nodeIds, i})
			return true
		}

		nodeIds.push(this._node.id)

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds)
		})
	}
}

export type ExpNodePortType = 'audio' | 'midi'

export type ExpNodePortIO = 'in' | 'out'

export type ExpNodePorts = readonly ExpNodeAudioPort[]
export type ExpNodeAudioInputPorts = readonly ExpNodeAudioInputPort[]
export type ExpNodeAudioOutputPorts = readonly ExpNodeAudioOutputPort[]

export enum ExpParamType {
	Frequency = 'Frequency',
	Boolean = 'Boolean',
	OscillatorType = 'OscillatorType',
}
