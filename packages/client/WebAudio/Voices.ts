import {OrderedMap, Set} from 'immutable'
import {logger} from '@corgifm/common/logger'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Voice} from '.'

export type OnEndedCallback = (id: number) => void

export abstract class Voices<V extends Voice> {
	protected _scheduledVoices = OrderedMap<number, V>()

	public constructor(
		protected _detune: number,
		protected _lowPassFilterCutoffFrequency: number,
	) {}

	protected get _allVoices() {
		return this._scheduledVoices
	}

	protected abstract _createVoice(invincible: boolean, note: IMidiNote): V

	public getScheduledVoices() {return this._scheduledVoices}

	public setDetune(detune: number) {
		this._detune = detune
		this._allVoices.forEach(x => x.setDetune(detune))
	}

	public setLowPassFilterCutoffFrequency(frequency: number) {
		this._lowPassFilterCutoffFrequency = frequency
		this._allVoices.forEach(x => x.setLowPassFilterCutoffFrequency(frequency))
	}

	public scheduleNote(
		note: IMidiNote,
		delaySeconds: number,
		attackTimeInSeconds: number,
		decayTimeInSeconds: number,
		sustain: number,
		filterAttackTimeInSeconds: number,
		filterDecayTimeInSeconds: number,
		filterSustain: number,
		invincible: boolean,
		sourceIds: Set<Id>,
	) {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) logger.error('delay <= 0: ', delaySeconds)

		const newNoteStartTime = this._getAudioContext().currentTime + delaySeconds

		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// It's only possible for there to be one conflicting voice, because of this function
		const conflictingVoices = scheduledVoicesSameNote.filter(
			x => x.scheduledAttackStartTime <= newNoteStartTime && newNoteStartTime < x.scheduledReleaseEndTimeSeconds,
		)

		if (conflictingVoices.count() > 1) {
			logger.error('[Voices][scheduleNote] conflictingVoices.count() > 1: ' + JSON.stringify(conflictingVoices, undefined, 2))
			logger.error(`[Voices][scheduleNote] conflictingVoices.count() > 1 | note: ${note} | newNoteStartTime: ${newNoteStartTime}`)
		}

		const conflictingVoice = conflictingVoices.first(undefined)

		if (conflictingVoice) {
			if (conflictingVoice.scheduledAttackStartTime === newNoteStartTime) return

			// schedule hard cutoff of existing note
			conflictingVoice.scheduleRelease(newNoteStartTime, 0)

			if (conflictingVoice.scheduledReleaseEndTimeSeconds > newNoteStartTime) {
				logger.error('[Voices][scheduleNote] conflictingVoice.scheduledReleaseEndTimeSeconds: ', conflictingVoice.scheduledReleaseEndTimeSeconds)
				logger.error('[Voices][scheduleNote] newNoteStartTime: ', newNoteStartTime)
				logger.error(`[Voices][scheduleNote] conflictingVoice.scheduledReleaseEndTimeSeconds >= newNoteStartTime`)
			}
		}

		const newVoice = this._createVoice(invincible, note)

		newVoice.scheduleNote(note, attackTimeInSeconds, decayTimeInSeconds, sustain, newNoteStartTime, sourceIds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)

		// Check if any scheduled voices start after this new note
		const nextScheduledVoiceStartSeconds = scheduledVoicesSameNote
			.filter(x => x.scheduledAttackStartTime > newNoteStartTime)
			.map(x => x.scheduledAttackStartTime)
			.min()

		if (nextScheduledVoiceStartSeconds) {
			newVoice.scheduleRelease(
				nextScheduledVoiceStartSeconds,
				0,
			)
		}
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) logger.error('delay <= 0: ', delaySeconds)

		const currentTime = this._getAudioContext().currentTime

		const releaseStartTime = currentTime + delaySeconds

		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// It's only possible for there to be one conflicting voice, because of this function
		const voicesToRelease = scheduledVoicesSameNote.filter(voice => {
			const voiceStartsBeforeRelease = voice.scheduledAttackStartTime <= releaseStartTime

			const voiceEndsAfterRelease = releaseStartTime < voice.scheduledReleaseEndTimeSeconds

			const voiceIsInWindow = voiceStartsBeforeRelease && voiceEndsAfterRelease

			return voiceIsInWindow
		})

		if (voicesToRelease.count() > 1) {
			logger.error(`voicesToRelease.count() > 1 | voicesToRelease: `, JSON.stringify(voicesToRelease, null, 2))
			logger.error(`note: `, note)
			logger.error(`delaySeconds: `, delaySeconds)
			logger.error(`releaseSeconds: `, releaseSeconds)
			logger.error(`currentTime: `, currentTime)
			logger.error(`releaseStartTime: `, releaseStartTime)
		}

		const voiceToRelease = voicesToRelease.first(undefined)

		if (!voiceToRelease) {
			logger.warn('[Voices][scheduleRelease] !voiceToRelease note: ', note)
			return
		}

		// If release is exactly on attack, release it
		//   because if the voice was already scheduled,
		//   then the release must have come after the attack
		// theres a chance that this might cause issues where someones note is played on another client
		// if (voiceToRelease.scheduledAttackStartTime === releaseStartTime) { }

		voiceToRelease.scheduleRelease(releaseStartTime, releaseSeconds)

		// Check if release crosses into another voice
		// Check same note voices, where voice attack start is in our release window
		const conflictingVoice = scheduledVoicesSameNote.find(voice => {
			const voiceStartsOnOrAfterReleaseStart = releaseStartTime <= voice.scheduledAttackStartTime

			const voiceStartsBeforeReleaseEnd = voice.scheduledAttackStartTime < releaseStartTime + releaseSeconds

			return voiceStartsOnOrAfterReleaseStart && voiceStartsBeforeReleaseEnd
		})

		if (conflictingVoice) {
			voiceToRelease.scheduleRelease(conflictingVoice.scheduledAttackStartTime, 0.001)
		}
	}

	public releaseAllScheduled(releaseSeconds: number) {
		this._scheduledVoices.filter(x => x.invincible === false)
			.forEach(x => {
				x.scheduleRelease(this._getAudioContext().currentTime, releaseSeconds, true)
			})
	}

	public releaseAllScheduledFromSourceId(releaseSeconds: number, sourceId: Id) {
		this._scheduledVoices.filter(x => x.sourceIds.includes(sourceId))
			.forEach(x => {
				if (x.sourceIds.count() > 1) {
					// TODO
					// eslint-disable-next-line no-param-reassign
					x.sourceIds = x.sourceIds.remove(sourceId)
				} else {
					x.scheduleRelease(this._getAudioContext().currentTime, releaseSeconds, true)
				}
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

	public dispose() {
		this._allVoices.forEach(x => x.dispose())
	}

	protected abstract _getAudioContext(): AudioContext

	protected _getOnEndedCallback(): OnEndedCallback {
		return (id: number) => (this._scheduledVoices = this._scheduledVoices.delete(id))
	}
}
