import {List} from 'immutable'
import {MidiAction, midiActions, NoteMidiAction} from '@corgifm/common/common-types'
import {logger} from '../client-logger'
import {CorgiNode} from './CorgiNode'
import {ExpMidiConnections, ExpMidiConnection} from './ExpConnections'
import {ExpPort, ExpPortSide, detectFeedbackLoop} from './ExpPorts'

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
		return this.node.detectMidiFeedbackLoop(i, nodeIds)
	}
}

export interface ExpMidiOutputPortArgs {
	readonly id: Id
	readonly name: string
}

export class ExpMidiOutputPort extends ExpMidiPort {
	private lastVoiceCount = 1
	private _activeNoteActions = new Map<number, NoteMidiAction>()

	public constructor(
		public readonly id: Id,
		public readonly name: string,
		public readonly node: CorgiNode,
	) {
		super(id, name, node, 'out')
	}

	public sendMidiAction: MidiReceiver = (midiAction: MidiAction) => {
		if (midiAction.type === 'MIDI_NOTE') {
			if (midiAction.gate) {
				this._activeNoteActions.set(midiAction.note, midiAction)
			} else {
				this._activeNoteActions.delete(midiAction.note)
			}
		}
		this._connections.forEach(this._sendMidiActionToConnection(midiAction))
		if (midiAction.type === 'VOICE_COUNT_CHANGE') {
			this.lastVoiceCount = midiAction.newCount
		}
	}

	private _sendMidiActionToConnection = (midiAction: MidiAction) => (connection: ExpMidiConnection) => {
		connection.sendMidiAction(midiAction)
	}

	public releaseAll = (time: number) => {
		const offTime = Math.max(this.node.singletonContext.getAudioContext().currentTime, time + 0.01)
		this._activeNoteActions.forEach(({note}) => {
			const offAction = midiActions.note(offTime, false, note, 0)
			this._connections.forEach(this._sendMidiActionToConnection(offAction))
		})
	}

	protected _connect = (connection: ExpMidiConnection) => {
		// TODO ?
		this.detectFeedbackLoop()
		connection.sendMidiAction(midiActions.voiceCountChange(0, this.lastVoiceCount))
	}

	public changeTarget = (oldTarget: ExpMidiInputPort, newTarget: ExpMidiInputPort, connection: ExpMidiConnection) => {
		// TODO ?
		this.detectFeedbackLoop()
		connection.sendMidiAction(midiActions.voiceCountChange(0, this.lastVoiceCount))
	}

	protected _disconnect = (connection: ExpMidiConnection) => {
	}

	public detectFeedbackLoop(i = 0, nodeIds = List<Id>()): boolean {
		return detectFeedbackLoop(this.node.id, this._connections, i, nodeIds)
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
