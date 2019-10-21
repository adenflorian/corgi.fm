/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {MidiAction} from '@corgifm/common/common-types'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpMidiConnections, ExpMidiConnection} from './ExpConnections'
import {ExpPort, ExpPortSide} from './ExpPorts'

export abstract class ExpMidiPort extends ExpPort {
	protected readonly _connections: ExpMidiConnections = new Map<Id, ExpMidiConnection>()

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, node, side, 'midi')
	}

	public connect = (connection: ExpMidiConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	public disconnect = (connection: ExpMidiConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
		this.onConnectionCountChanged.invokeNextFrame(this.connectionCount)
	}

	protected abstract _connect(connection: ExpMidiConnection): void
	protected abstract _disconnect(connection: ExpMidiConnection): void
}

export type MidiReceiver = (midiAction: MidiAction) => void

export interface ExpMidiInputPortArgs {
	readonly id: Id
	readonly name: string
	readonly destination: MidiReceiver
}

export class ExpMidiInputPort extends ExpMidiPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
		public readonly destination: MidiReceiver
	) {
		super(id, name, node, 'in')
	}

	protected _connect = (connection: ExpMidiConnection) => {}

	protected _disconnect = (connection: ExpMidiConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.node.detectAudioFeedbackLoop(i, nodeIds)
	}
}

export interface ExpMidiOutputPortArgs {
	readonly id: Id
	readonly name: string
}

export class ExpMidiOutputPort extends ExpMidiPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
	) {
		super(id, name, node, 'out')
	}

	public sendMidiAction: MidiReceiver = (...args) => {
		this._connections.forEach(connection => {
			connection.getTarget().destination(...args)
		})
	}

	protected _connect = (connection: ExpMidiConnection) => {
		// TODO ?
		this.detectFeedbackLoop()
	}

	public changeTarget = (oldTarget: ExpMidiInputPort, newTarget: ExpMidiInputPort) => {
		// TODO ?
		this.detectFeedbackLoop()
	}

	protected _disconnect = (connection: ExpMidiConnection) => {
	}

	public detectFeedbackLoop(i = 0, nodeIds: List<Id> = List()): boolean {
		if (nodeIds.includes(this.node.id)) {
			logger.warn('detected feedback loop because matching nodeId: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}
		if (i > 500) {
			logger.warn('detected feedback loop because i too high: ', {nodeId: this.node.id, nodeIds, i})
			return true
		}

		if (this._connections.size === 0) return false

		return [...this._connections].some(([_, connection]) => {
			return connection.detectFeedbackLoop(i + 1, nodeIds.push(this.node.id))
		})
	}
}
export type ExpMidiInputPorts = readonly ExpMidiInputPort[]
export type ExpMidiOutputPorts = readonly ExpMidiOutputPort[]

export function isMidiOutputPort(val: unknown): val is ExpMidiOutputPort {
	return val instanceof ExpMidiOutputPort
}

export function isMidiInputPort(val: unknown): val is ExpMidiInputPort {
	return val instanceof ExpMidiInputPort
}