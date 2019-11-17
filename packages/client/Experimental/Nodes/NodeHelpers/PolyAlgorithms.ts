import * as immutable from 'immutable'
import {IMidiNote} from '@corgifm/common/MidiNote'

export interface VoiceIndex extends Number {}

export interface PolyAlgorithm {
	getVoiceForNoteOn: (note: IMidiNote) => VoiceIndex
	getVoiceForNoteOff: (note: IMidiNote) => VoiceIndex | undefined
}

export class RoundRobin implements PolyAlgorithm {
	private _voiceMap = immutable.Map<VoiceIndex, IMidiNote>()
	private _lastVoiceUsed: VoiceIndex = -1

	public constructor(
		public readonly voiceCount: number,
	) {}

	public getVoiceForNoteOn(note: IMidiNote) {
		(this._lastVoiceUsed as number)++

		if (this._lastVoiceUsed >= this.voiceCount) this._lastVoiceUsed = 0

		this._voiceMap = this._voiceMap.set(this._lastVoiceUsed, note)

		return this._lastVoiceUsed
	}

	public getVoiceForNoteOff(note: IMidiNote) {
		const voice = this._voiceMap.keyOf(note)

		if (voice === undefined) {
			return undefined
		} else {
			this._voiceMap = this._voiceMap.delete(voice)
			return voice
		}
	}
}

export class Optimal implements PolyAlgorithm {

	public getVoiceForNoteOn(note: IMidiNote) {
		return 0
	}

	public getVoiceForNoteOff(note: IMidiNote) {
		return 0
	}
}
