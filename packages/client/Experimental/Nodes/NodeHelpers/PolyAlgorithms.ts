/* eslint-disable no-empty-function */
import * as immutable from 'immutable'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'

export interface VoiceIndex extends Number {}

export abstract class PolyAlgorithm {
	public abstract getVoiceForNoteOn(note: IMidiNote): VoiceIndex
	public abstract getVoiceForNoteOff(note: IMidiNote): VoiceIndex | undefined

	public constructor(
		public readonly voiceCount: CorgiNumberChangedEvent,
	) {
		voiceCount.subscribe(this._onVoiceCountChange)
	}

	protected readonly _onVoiceCountChange = (newVoiceCount: number) => {
		// const realNewVoiceCount = Math.round(newVoiceCount)
	}
}

export class RoundRobin extends PolyAlgorithm {
	private _voiceMap = immutable.Map<VoiceIndex, IMidiNote>()
	private _lastVoiceUsed: VoiceIndex = -1

	public getVoiceForNoteOn(note: IMidiNote) {
		(this._lastVoiceUsed as number)++

		if (this._lastVoiceUsed >= Math.round(this.voiceCount.current)) this._lastVoiceUsed = 0

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
