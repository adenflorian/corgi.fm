import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpNodeAudioConnections, ExpNodeAudioConnection} from './ExpConnections'

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

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
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
		try {
			this.source.disconnect(oldTarget.destination as AudioNode)
		} catch (error) {
			logger.warn('[changeTarget] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
		if (!this.detectFeedbackLoop()) {
			this.source.connect(newTarget.destination as AudioNode)
		}
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		try {
			this.source.disconnect(connection.getTarget().destination as AudioNode)
		} catch (error) {
			logger.warn('[_disconnect] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this._node.id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this._node.id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this._node.id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this._node.id))
		})
	}
}

export type ExpNodePortType = 'audio' | 'midi'

export type ExpNodePortIO = 'in' | 'out'

export type ExpNodePorts = readonly ExpNodeAudioPort[]
export type ExpNodeAudioInputPorts = readonly ExpNodeAudioInputPort[]
export type ExpNodeAudioOutputPorts = readonly ExpNodeAudioOutputPort[]
