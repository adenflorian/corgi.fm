/* eslint-disable no-empty-function */
import {List} from 'immutable'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpPolyphonicConnections, ExpPolyphonicConnection} from './ExpConnections'
import {ExpPort, ExpPortSide, detectFeedbackLoop} from './ExpPorts'
import {MidiReceiver} from './ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'

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
		public readonly node: PolyInNode,
	) {
		super(id, name, node, 'in')
	}

	protected _connect = (connection: ExpPolyphonicConnection) => {}

	protected _disconnect = (connection: ExpPolyphonicConnection) => {}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this.node.detectPolyphonicFeedbackLoop(i, nodeIds)
	}
}

export interface ExpPolyphonicOutputPortArgs {
	readonly id: Id
	readonly name: string
}

export class PolyVoice {
	private readonly _gateInput: MidiReceiver
	private readonly _pitchInput: ConstantSourceNode
	private readonly _pitchWaveShaper: WaveShaperNode

	public constructor(
		public readonly index: number,
		private readonly _audioContext: AudioContext,
	) {
		this._gateInput = () => {}
		this._pitchInput = this._audioContext.createConstantSource()
		this._pitchInput.start()
		this._pitchWaveShaper = this._audioContext.createWaveShaper()
		this._pitchWaveShaper.curve = new Float32Array([-3, 1])

		this._pitchInput.connect(this._pitchWaveShaper)

		// Instantiate node graph

	}

	public sendMidiAction(midiAction: MidiAction) {
		// TODO
	}

	public get pitchSource() {return this._pitchInput.offset}

	public get pitchOut(): AudioNode {return this._pitchWaveShaper}

	public dispose() {
		this._pitchInput.stop()
		this._pitchInput.disconnect()
		this._pitchWaveShaper.disconnect()
	}
}

export type PolyVoices = PolyVoice[]
export type ReadonlyPolyVoices = readonly PolyVoice[]

export interface PolyOutNode extends CorgiNode {
}

export interface PolyInNode extends CorgiNode {
}

export class ExpPolyphonicOutputPort extends ExpPolyphonicPort {
	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: PolyOutNode,
	) {
		super(id, name, node, 'out')
	}

	protected _connect = (connection: ExpPolyphonicConnection) => {
	}

	public changeTarget = (oldTarget: ExpPolyphonicInputPort, newTarget: ExpPolyphonicInputPort) => {
	}

	protected _disconnect = (connection: ExpPolyphonicConnection) => {
	}

	public dispose() {
		super.dispose()
	}

	public detectFeedbackLoop(i = 0, nodeIds = List<Id>()): boolean {
		return detectFeedbackLoop(this.node.id, this._connections, i, nodeIds)
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
