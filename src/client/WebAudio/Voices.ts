import {OrderedMap} from 'immutable'
import {IMidiNote} from '../../common/MidiNote'
import {Voice} from './index'

export type OnEndedCallback = (id: number) => void

export abstract class Voices<V extends Voice> {
	protected _inactiveVoices = OrderedMap<number, V>()
	protected _activeVoices = OrderedMap<number, V>()
	protected _releasingVoices = OrderedMap<number, V>()
	protected _scheduledVoices = OrderedMap<number, V>()

	protected get _allVoices() {
		return this._inactiveVoices
			.concat(this._activeVoices)
			.concat(this._releasingVoices)
			.concat(this._scheduledVoices)
	}

	public getScheduledVoices() {return this._scheduledVoices}

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

	public abstract createVoice(forScheduling: boolean): V

	public scheduleNote(note: IMidiNote, delaySeconds: number, attackTimeInSeconds: number) {

		const newNoteStartTime = this._getAudioContext().currentTime + delaySeconds

		// check for any scheduled notes playing same note that will overlap
		// if new note start is in middle of existing note, then schedule hard cutoff of existing note
		//   or schedule new attack on existing voice
		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// Its only possible for there to be one conflicting voice, because of this function

		const conflictingVoice = scheduledVoicesSameNote.find(
			x => x.getScheduledAttackStartTime() <= newNoteStartTime && newNoteStartTime < x.getScheduledReleaseEndTimeSeconds())

		if (conflictingVoice) {
			// logger.log('conflictingVoice')
			if (conflictingVoice.getScheduledAttackStartTime() === newNoteStartTime) return

			// schedule hard cutoff of existing note
			conflictingVoice.scheduleRelease(delaySeconds, 0.001)
		}

		// Need to do something if new note starts before all scheduled notes
		// need to schedule a release for it immediately

		// I should probably keep one voice per note

		// logger.log('[scheduleNote] ' + this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)
		const newVoice = this.createVoice(true)

		newVoice.scheduleNote(note, attackTimeInSeconds, delaySeconds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)

		// Check if any scheduled voices start after this new note
		const voicesAfter = scheduledVoicesSameNote.filter(x => x.getScheduledAttackStartTime() > newNoteStartTime)

		if (voicesAfter.count() > 0) {
			// logger.log('scheduling hard cutoff for new note because it is behind a future note. newVoice: ', newVoice)
			const closestScheduledStart = voicesAfter.map(x => x.getScheduledAttackStartTime()).min()
			if (closestScheduledStart === undefined) throw new Error('shouldnt happen i think')

			newVoice.scheduleRelease(
				closestScheduledStart - this._getAudioContext().currentTime,
				0.001,
			)
		}
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		const currentTime = this._getAudioContext().currentTime

		const releaseStartTime = currentTime + delaySeconds

		// Find scheduled voice that will be playing at releaseStartTime
		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// Its only possible for there to be one conflicting voice, because of this function
		const voiceToRelease = scheduledVoicesSameNote.find(
			x => x.getScheduledAttackStartTime() <= releaseStartTime && releaseStartTime < x.getScheduledReleaseEndTimeSeconds())

		if (voiceToRelease) {
			// logger.log('found voiceToRelease: ', voiceToRelease)
			if (voiceToRelease.getScheduledAttackStartTime() === releaseStartTime) return

			voiceToRelease.scheduleRelease(delaySeconds, releaseSeconds)

			// logger.log('[scheduleRelease] note: ' + note + ' | this._scheduledVoices: ', this._scheduledVoices)

			// Check if release crosses into another voice
			// Check same note voices, where voice attack start is in our release window
			const conflictingVoice = scheduledVoicesSameNote.find(
				x => releaseStartTime <= x.getScheduledAttackStartTime() && x.getScheduledAttackStartTime() < releaseStartTime + releaseSeconds)

			if (conflictingVoice) {
				// logger.log('conflictingVoice in release window, conflictingVoice: ', conflictingVoice)
				// schedule hard cutoff on voiceToRelease
				const hardCutoffDelay = conflictingVoice.getScheduledAttackStartTime() - currentTime
				voiceToRelease.scheduleRelease(hardCutoffDelay, 0.001)
			}
		} else {

			// logger.log('[scheduleRelease] no matching voice to release, note: ', note)
		}
	}

	public releaseAllScheduled(releaseSeconds: number) {
		this._scheduledVoices.forEach(x => {
			x.scheduleRelease(0, releaseSeconds, true)
		})
	}

	public changeAttackForScheduledVoices(newAttackSeconds: number) {
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
