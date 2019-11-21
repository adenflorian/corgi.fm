/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpPolyphonicConnections, ExpPolyphonicConnection} from './ExpConnections'
import {ExpPort, ExpPortSide} from './ExpPorts'

export abstract class ExpPolyphonicPort extends ExpPort {
	protected readonly _connections: ExpPolyphonicConnections = new Map<Id, ExpPolyphonicConnection>()

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, node, side, 'polyphonic')
	}

	public connect = (connection: ExpPolyphonicConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	public disconnect = (connection: ExpPolyphonicConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	protected abstract _connect(connection: ExpPolyphonicConnection): void
	protected abstract _disconnect(connection: ExpPolyphonicConnection): void
}

export interface ExpPolyphonicInputPortArgs {
	readonly id: Id
	readonly name: string
}

export class ExpPolyphonicInputPort extends ExpPolyphonicPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
	) {
		super(id, name, node, 'in')
	}

	protected _connect = (connection: ExpPolyphonicConnection) => {}

	protected _disconnect = (connection: ExpPolyphonicConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.node.detectAudioFeedbackLoop(i, nodeIds)
	}
}

export interface ExpPolyphonicOutputPortArgs {
	readonly id: Id
	readonly name: string
}

export class ExpPolyphonicOutputPort extends ExpPolyphonicPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
	) {
		super(id, name, node, 'out')
	}

	protected _connect = (connection: ExpPolyphonicConnection) => {
		this.detectFeedbackLoop()
	}

	public changeTarget = (oldTarget: ExpPolyphonicInputPort, newTarget: ExpPolyphonicInputPort) => {
		this.detectFeedbackLoop()
	}

	protected _disconnect = (connection: ExpPolyphonicConnection) => {
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this.node.id)) {
			logger.warn('[ExpPolyphonicOutputPort] detected feedback loop because matching nodeId: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('[ExpPolyphonicOutputPort] detected feedback loop because i too high: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this.node.id))
		})
	}
}
export type ExpPolyphonicInputPorts = readonly ExpPolyphonicInputPort[]
export type ExpPolyphonicOutputPorts = readonly ExpPolyphonicOutputPort[]

export function isPolyphonicOutputPort(val: unknown): val is ExpPolyphonicOutputPort {
	return val instanceof ExpPolyphonicOutputPort
}

export function isPolyphonicInputPort(val: unknown): val is ExpPolyphonicInputPort {
	return val instanceof ExpPolyphonicInputPort
}
