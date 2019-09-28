export type ExpAudioParams = Map<string, ExpAudioParam>

export interface ExpAudioParam {
	audioParam: AudioParam
	min: number
	max: number
	default: number
}

export interface ParamChange {
	nodeId: Id
	paramId: Id
	newValue: number | string | boolean
	timestamp: number
	type: ExpParamType
}

export interface ParamDescriptor {
	paramId: Id
	type: ExpParamType

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
	) {}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public connectSource(source: ExpNodeAudioOutputPort) {
		this._source = source
	}

	public connectTarget(target: ExpNodeAudioInputPort) {
		this._target = target
	}
}

export type ExpNodeAudioConnections = Map<Id, ExpNodeAudioConnection>

export abstract class ExpNodeAudioPort {
	protected readonly _connections: ExpNodeAudioConnections = new Map<Id, ExpNodeAudioConnection>()

	public constructor(
		public readonly id: number,
		public readonly name: string,
	) {}

	public connect(connection: ExpNodeAudioConnection) {
		this._connections.set(connection.id, connection)
	}

	public disconnect(connectionId: Id) {
		this._connections.delete(connectionId)
	}
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name)
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
}

export type ExpNodePortType = 'audio' | 'midi'

export type ExpNodePortIO = 'in' | 'out'

export type ExpNodePorts = Map<number, ExpNodeAudioPort>
export type ExpNodeAudioInputPorts = Map<number, ExpNodeAudioInputPort>
export type ExpNodeAudioOutputPorts = Map<number, ExpNodeAudioOutputPort>

export enum ExpParamType {
	Frequency = 'Frequency',
	Boolean = 'Boolean',
	OscillatorType = 'OscillatorType',
}
