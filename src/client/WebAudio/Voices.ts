import {OrderedMap} from 'immutable'
import {IMidiNote} from '../../common/MidiNote'
import {Voice} from './index'

export type OnEndedCallback = (id: number) => void

export abstract class Voices<V extends Voice> {
	protected _inactiveVoices = OrderedMap<number, V>()
	protected _activeVoices = OrderedMap<number, V>()
	protected _releasingVoices = OrderedMap<number, V>()
	protected _scheduledVoices = OrderedMap<number, V>()

	constructor(
		protected _detune: number,
	) {}

	protected get _allVoices() {
		return this._inactiveVoices
			.concat(this._activeVoices)
			.concat(this._releasingVoices)
			.concat(this._scheduledVoices)
	}

	protected abstract _createVoice(forScheduling: boolean, invincible: boolean): V

	public getScheduledVoices() {return this._scheduledVoices}

	public setDetune(detune: number) {
		this._detune = detune
		this._allVoices.forEach(x => x.setDetune(detune))
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		const voice = this._getVoice(note)

		voice.playNote(note, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		const voice = this._activeVoices.find(x => x.playingNote === note)

		if (voice) {
			const releaseId = voice.release(timeToReleaseInSeconds)

			this._activeVoices = this._activeVoices.delete(voice.id)
			this._releasingVoices = this._releasingVoices.set(voice.id, voice)

			setTimeout(() => {
				const releasingVoice = this._releasingVoices.find(x => x.getReleaseId() === releaseId)
				if (releasingVoice) {
					this._releasingVoices = this._releasingVoices.filter(x => x.getReleaseId() !== releaseId)
					this._inactiveVoices = this._inactiveVoices.set(releasingVoice.id, releasingVoice)
				}
			}, timeToReleaseInSeconds * 1000)
		}
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number, attackTimeInSeconds: number, invincible: boolean) {

		const newNoteStartTime = this._getAudioContext().currentTime + delaySeconds

		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// It's only possible for there to be one conflicting voice, because of this function
		const conflictingVoice = scheduledVoicesSameNote.find(
			x => x.scheduledAttackStartTime <= newNoteStartTime && newNoteStartTime < x.scheduledReleaseEndTimeSeconds)

		if (conflictingVoice) {
			if (conflictingVoice.scheduledAttackStartTime === newNoteStartTime) return

			// schedule hard cutoff of existing note
			conflictingVoice.scheduleRelease(delaySeconds, 0.001)
		}

		const newVoice = this._createVoice(true, invincible)

		newVoice.scheduleNote(note, attackTimeInSeconds, delaySeconds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)

		// Check if any scheduled voices start after this new note
		const nextScheduledVoiceStartSeconds = scheduledVoicesSameNote
			.filter(x => x.scheduledAttackStartTime > newNoteStartTime)
			.map(x => x.scheduledAttackStartTime)
			.min()

		if (nextScheduledVoiceStartSeconds) {
			newVoice.scheduleRelease(
				nextScheduledVoiceStartSeconds - this._getAudioContext().currentTime,
				0.001,
			)
		}
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		const currentTime = this._getAudioContext().currentTime

		const releaseStartTime = currentTime + delaySeconds

		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// It's only possible for there to be one conflicting voice, because of this function
		const voiceToRelease = scheduledVoicesSameNote.find(voice => {
			const voiceStartsBeforeRelease = voice.scheduledAttackStartTime <= releaseStartTime

			const voiceEndsAfterRelease = releaseStartTime < voice.scheduledReleaseEndTimeSeconds

			const voiceIsInWindow = voiceStartsBeforeRelease && voiceEndsAfterRelease

			return voiceIsInWindow
		})

		if (!voiceToRelease) return

		// Don't bother if release is exactly on attack
		// TODO This might be wrong...
		if (voiceToRelease.scheduledAttackStartTime === releaseStartTime) return

		voiceToRelease.scheduleRelease(delaySeconds, releaseSeconds)

		// Check if release crosses into another voice
		// Check same note voices, where voice attack start is in our release window
		const conflictingVoice = scheduledVoicesSameNote.find(voice => {
			const voiceStartsOnOrAfterReleaseStart = releaseStartTime <= voice.scheduledAttackStartTime

			const voiceStartsBeforeReleaseEnd = voice.scheduledAttackStartTime < releaseStartTime + releaseSeconds

			return voiceStartsOnOrAfterReleaseStart && voiceStartsBeforeReleaseEnd
		})

		if (conflictingVoice) {
			const hardCutoffDelay = conflictingVoice.scheduledAttackStartTime - currentTime
			voiceToRelease.scheduleRelease(hardCutoffDelay, 0.001)
		}
	}

	public releaseAllScheduled(releaseSeconds: number) {
		this._scheduledVoices.filter(x => x.invincible === false)
			.forEach(x => {
				x.scheduleRelease(0, releaseSeconds, true)
			})
	}

	public changeAttackLengthForScheduledVoices(newAttackSeconds: number) {
		// ask each voice to update attack?
		// do we need to filter first?
		// maybe only voices that...
		// just do all for now
		this._scheduledVoices.forEach(x => {
			x.changeScheduledAttack(newAttackSeconds)
		})
	}

	public getActivityLevel = () => {
		if (this._activeVoices.count() > 0) return 1
		if (this._releasingVoices.count() > 0) return 0.5
		return 0
	}

	public dispose() {
		this._allVoices.forEach(x => x.dispose())
	}

	protected abstract _getAudioContext(): AudioContext

	protected _getVoice(note: number): V {
		// Look for active voice that is playing same note
		const sameNoteActiveVoice = this._activeVoices.find(x => x.playingNote === note)

		if (sameNoteActiveVoice) {
			this._activeVoices = this._activeVoices.filter(x => x !== sameNoteActiveVoice)
			this._activeVoices = this._activeVoices.set(sameNoteActiveVoice.id, sameNoteActiveVoice)
			return sameNoteActiveVoice
		}

		// Look for releasing voice that is playing same note
		const sameNoteReleasingVoice = this._releasingVoices.find(x => x.playingNote === note)

		if (sameNoteReleasingVoice) {
			this._releasingVoices = this._releasingVoices.filter(x => x !== sameNoteReleasingVoice)
			this._activeVoices = this._activeVoices.set(sameNoteReleasingVoice.id, sameNoteReleasingVoice)
			return sameNoteReleasingVoice
		}

		if (this._inactiveVoices.count() > 0) {
			// Try to return inactive voice first
			const voice = this._inactiveVoices.first() as V
			this._inactiveVoices = this._inactiveVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else if (this._releasingVoices.count() > 0) {
			// Next try releasing voices
			const voice = this._releasingVoices.first() as V
			this._releasingVoices = this._releasingVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else {
			// Lastly use active voices
			const voice = this._activeVoices.first() as V
			this._activeVoices = this._activeVoices.delete(voice.id).set(voice.id, voice)
			return voice
		}
	}

	protected _getOnEndedCallback(): OnEndedCallback {
		return (id: number) => (this._scheduledVoices = this._scheduledVoices.delete(id))
	}
}
