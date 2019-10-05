/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection,
	ExpNodeConnections, ExpNodeConnection,
} from './ExpConnections'

export type ExpPortCallback = (port: ExpPort) => void

export interface ExpPortReact extends ExpPort {}

export abstract class ExpPort {
	public readonly subscribers = new Map<ExpPortCallback, ExpPortCallback>()
	protected readonly _connections: ExpNodeConnections = new Map<Id, ExpNodeConnection>()
	private _position: Point = {x: 0, y: 0}

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly side: ExpPortSide,
		public readonly type: ExpPortType,
	) {}

	public get position() {return this._position}

	public get connectionCount() {return this._connections.size}

	public setPosition(newPosition: Point) {
		this._position = newPosition
		this.onUpdated()
	}

	public onUpdated() {
		logger.log('ExpPort onUpdated:', this)
		this.subscribers.forEach(x => x(this))
		this._connections.forEach(x => x.onPortUpdated(this))
	}
}

export type ExpPorts = Map<Id, ExpPort>

export abstract class ExpNodeAudioPort extends ExpPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		side: ExpPortSide,
	) {
		super(id, name, getNode, side, 'audio')
	}

	public connect = (connection: ExpNodeAudioConnection) => {
		this._connections.set(connection.id, connection)
		this._connect(connection)
		this.onUpdated()
	}

	public disconnect = (connection: ExpNodeAudioConnection) => {
		this._disconnect(connection)
		this._connections.delete(connection.id)
		this.onUpdated()
	}

	protected abstract _connect(connection: ExpNodeAudioConnection): void
	protected abstract _disconnect(connection: ExpNodeAudioConnection): void
}

export interface ExpNodeAudioInputPortArgs {
	readonly id: Id
	readonly name: string
	readonly destination: AudioNode | AudioParam
}

export class ExpNodeAudioInputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly destination: AudioNode | AudioParam
	) {
		super(id, name, getNode, 'in')
	}

	protected _connect = (connection: ExpNodeAudioConnection) => {}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.getNode().detectAudioFeedbackLoop(i, nodeIds)
	}
}

export interface ExpNodeAudioOutputPortArgs {
	readonly id: Id
	readonly name: string
	readonly source: AudioNode
}

export class ExpNodeAudioOutputPort extends ExpNodeAudioPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly getNode: () => CorgiNode,
		public readonly source: AudioNode
	) {
		super(id, name, getNode, 'out')
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
		this.onUpdated()
	}

	protected _disconnect = (connection: ExpNodeAudioConnection) => {
		try {
			this.source.disconnect(connection.getTarget().destination as AudioNode)
		} catch (error) {
			logger.warn('[_disconnect] error while disconnecting ExpNodeAudioOutputPort: ', {error})
		}
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

export type ExpPortSide = 'in' | 'out'

export type ExpPortType = 'audio' | 'gate' | 'dummy'

export type ExpNodeAudioInputPorts = readonly ExpNodeAudioInputPort[]
export type ExpNodeAudioOutputPorts = readonly ExpNodeAudioOutputPort[]

export function isAudioOutputPort(val: unknown): val is ExpNodeAudioOutputPort {
	return val instanceof ExpNodeAudioOutputPort
}

export function isAudioInputPort(val: unknown): val is ExpNodeAudioInputPort {
	return val instanceof ExpNodeAudioInputPort
}
