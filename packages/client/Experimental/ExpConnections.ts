import {List} from 'immutable'
import {ExpNodeAudioPort, ExpNodeAudioOutputPort, ExpNodeAudioInputPort} from './ExpPorts'

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
		const oldTarget = this._target
		this._target = newTarget
		oldTarget.disconnect(this)
		newTarget.connect(this)
		this._source.changeTarget(oldTarget, newTarget)
	}

	public dispose() {
		this._source.disconnect(this)
		this._target.disconnect(this)
	}

	public detectFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return this._target.detectFeedbackLoop(i, nodeIds)
	}
}

export type ExpNodeAudioConnections = Map<Id, ExpNodeAudioConnection>
