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
}

export type ExpNodeAudioConnections = Map<Id, ExpNodeAudioConnection>

export abstract class ExpNodeAudioPort {
	protected readonly _connections: ExpNodeAudioConnections = new Map<Id, ExpNodeAudioConnection>()

	public constructor(
		public readonly id: number,
		public readonly name: string,
	) {}

	public connect = (connection: ExpNodeAudioConnection) => {
		this._connect(connection)
		this._connections.set(connection.id, connection)
	}

	public disconnect = (connection: ExpNodeAudioConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
	}

	protected abstract _connect(connection: ExpNodeAudioConnection): void
	protected abstract _disconnect(connection: ExpNodeAudioConnection): void
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name)
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
	}
}

export class ExpNodeAudioOutputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly source: AudioNode
	) {
		super(id, name)
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {
		this.source.connect(connection.getTarget().destination as AudioNode)
	}

	public changeTarget = (oldTarget: ExpNodeAudioInputPort, newTarget: ExpNodeAudioInputPort) => {
		this.source.disconnect(oldTarget.destination as AudioNode)
		this.source.connect(newTarget.destination as AudioNode)
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		this.source.disconnect(connection.getTarget().destination as AudioNode)
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