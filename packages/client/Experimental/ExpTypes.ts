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
		private _source: ExpNodePort,
		private _target: ExpNodePort,
	) {}

	public getSource() {
		return this._source
	}

	public getTarget() {
		return this._target
	}

	public connectSource(source: ExpNodePort) {
		this._source = source
	}

	public connectTarget(target: ExpNodePort) {
		this._target = target
	}
}

export type ExpNodeConnections = Map<Id, ExpNodeConnection>

export abstract class ExpNodePort {
	protected readonly _connections: ExpNodeConnections = new Map<Id, ExpNodeConnection>()

	public constructor(
		public readonly id: number,
		public readonly name: string,
	) {}

	public connect(connection: ExpNodeConnection) {
		this._connections.set(connection.id, connection)
	}
}

export class ExpNodeAudioInputPort extends ExpNodePort {
	public constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name)
	}
}

export class ExpNodeAudioOutputPort extends ExpNodePort {
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

export type ExpNodePorts = Map<number, ExpNodePort>
export type ExpNodeAudioInputPorts = Map<number, ExpNodeAudioInputPort>
export type ExpNodeAudioOutputPorts = Map<number, ExpNodeAudioOutputPort>

export enum ExpParamType {
	Frequency = 'Frequency',
	Boolean = 'Boolean',
	OscillatorType = 'OscillatorType',
}
