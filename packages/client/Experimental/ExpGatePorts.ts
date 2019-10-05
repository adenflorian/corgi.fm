/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpGateConnections, ExpGateConnection} from './ExpConnections'
import {ExpPort, ExpPortSide} from './ExpPorts'

export abstract class ExpGatePort extends ExpPort {
	protected readonly _connections: ExpGateConnections = new Map<Id, ExpGateConnection>()

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, getNode, side, 'gate')
	}

	public connect = (connection: ExpGateConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onUpdated()
	}

	public disconnect = (connection: ExpGateConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
		this.onUpdated()
	}

	protected abstract _connect(connection: ExpGateConnection): void
	protected abstract _disconnect(connection: ExpGateConnection): void
}

export type GateReceiver = (gate: boolean, time: number) => void

export interface ExpGateInputPortArgs {
	readonly id: Id
	readonly name: string
	readonly destination: GateReceiver
}

export class ExpGateInputPort extends ExpGatePort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly destination: GateReceiver
	) {
		super(id, name, getNode, 'in')
	}

	protected _connect = (connection: ExpGateConnection) => {}

	protected _disconnect = (connection: ExpGateConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.getNode().detectAudioFeedbackLoop(i, nodeIds)
	}
}

export interface ExpGateOutputPortArgs {
	readonly id: Id
	readonly name: string
}

export class ExpGateOutputPort extends ExpGatePort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
	) {
		super(id, name, getNode, 'out')
	}

	public sendGateSignal: GateReceiver = (...args) => {
		this._connections.forEach(connection => {
			connection.getTarget().destination(...args)
		})
	}

	protected _connect = (connection: ExpGateConnection) => {
		// TODO ?
		this.detectFeedbackLoop()
	}

	public changeTarget = (oldTarget: ExpGateInputPort, newTarget: ExpGateInputPort) => {
		// TODO ?
		this.detectFeedbackLoop()
	}

	protected _disconnect = (connection: ExpGateConnection) => {
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this.getNode().id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this.getNode().id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this.getNode().id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this.getNode().id))
		})
	}
}
export type ExpGateInputPorts = readonly ExpGateInputPort[]
export type ExpGateOutputPorts = readonly ExpGateOutputPort[]

export function isGateOutputPort(val: unknown): val is ExpGateOutputPort {
	return val instanceof ExpGateOutputPort
}

export function isGateInputPort(val: unknown): val is ExpGateInputPort {
	return val instanceof ExpGateInputPort
}
