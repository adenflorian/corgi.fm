import {stripIndents} from 'common-tags'

export const mainBoardsId = 'mainBoards'
export const zoomBackgroundClass = 'zoomBackground'
export const backgroundMenuId = 'backgroundMenuId'
export const nodeMenuId = 'nodeMenuId'
export const panToolTip = stripIndents`
	Panning
	Controls how far left and right the sound is
`
export const filterToolTip = stripIndents`
	Filter
	Shapes the sound, usually by attenuating certain frequencies
`
export const gainToolTip = stripIndents`
	Gain (volume)
	1 is 0 db and 0 is -infinite db
`
export const playbackRateToolTip = stripIndents`
	Playback Rate
	Controls how fast the sample plays
`
export const attackToolTip = stripIndents`
	Attack time in seconds
	The time between starting a note and it reaching max volume
`
export const decayToolTip = stripIndents`
	Decay time in seconds
	The time it takes from the end of the attack until the sustain volume
`
export const sustainToolTip = stripIndents`
	Sustain
	Amplitude of note after decay
`
export const releaseToolTip = stripIndents`
	Release time in seconds
	The time between releasing a note and the amplitude reaching 0
`
export const filterAttackToolTip = stripIndents`
	Attack time in seconds
`
export const filterDecayToolTip = stripIndents`
	Decay time in seconds
`
export const filterSustainToolTip = stripIndents`
	Amount of filter to apply?
`
export const filterReleaseToolTip = stripIndents`
	Release time in seconds
`
export const detuneToolTip = stripIndents`
	Detune in percentage of a half step
	Fine grained pitch control, where 100% is 1 half step above the current note
`
export const sequencerGateToolTip = stripIndents`
	Gate
	Controls how long each note is held down before releasing
`
export const sequencerPitchToolTip = stripIndents`
	Pitch
	Controls note midi pitch in half steps
`
export const sequencerRateToolTip = stripIndents`
	Rate
	Controls note length and sequencer length
	Rate is for each note
	Meaning, at 1/4, each note is a quarter note
`
export const sequencerPlayToolTip = stripIndents`
	Play this sequencer and the Master Clock
`
export const sequencerStopToolTip = stripIndents`
	Stop this sequencer
`
export const sequencerRecordToolTip = stripIndents`
	Record
	Toggles record mode
	You must connect a virtual keyboard into this sequencer to record notes
`
export const sequencerDownloadToolTip = stripIndents`
	Download MIDI
`
export const sequencerEraseToolTip = stripIndents`
	Erase all notes
`
export const sequencerUndoToolTip = stripIndents`
	Undo
	Ctrl + Z
	Cmd + Z
`
export const graphSizeX = 12800
export const graphSizeY = 7200

export const longLineTooltip = 'Right click to delete'

export function panValueToString(pan: number) {
	if (pan === 0) return 'C'
	if (pan < 0) return Math.abs(pan).toFixed(2) + ' L'
	return pan.toFixed(2) + ' R'
}

export function filterValueToString(frequencyHz: number) {
	return frequencyHz.toFixed(0) + ' Hz'
}

export function lfoRateValueToString(rate: number) {
	if (rate < 10) return rate.toFixed(3) + ' Hz'
	if (rate < 100) return rate.toFixed(2) + ' Hz'
	if (rate < 1000) return rate.toFixed(1) + ' Hz'
	return rate.toFixed(0) + ' Hz'
}

export function detuneValueToString(detune: number) {
	return detune.toFixed(0).replace(/^-0$/, '0') + ' cents'
}

export function percentageValueString(num: number) {
	return (num * 100).toFixed(0) + '%'
}

export function percentageValueStringCurved(num: number) {
	const percent = num * 100
	if (percent < 10) return percent.toFixed(2) + '%'
	if (percent < 100) return percent.toFixed(1) + '%'
	return percent.toFixed(0) + '%'
}

export function seqGateValueToString(pitch: number) {
	return pitch.toFixed(2).replace(/\.00$/, '')
}

export function seqRateValueToString(rate: number) {
	const adjustedRate = rate / 4
	if (adjustedRate > 1) return adjustedRate.toFixed(0) + ' bars'
	if (adjustedRate === 1) return adjustedRate.toFixed(0) + ' bar'
	return `1/${1 / adjustedRate}`
}

export function seqLengthValueToString(length: number) {
	if (length === 1) return `1 bar`

	return (length.toFixed(2) + ` bars`)
		.replace('.00', '')
		.replace('.67', '.66')
}

export function seqPitchValueToString(pitch: number) {
	if (pitch > 0) return '+' + pitch.toFixed(0) + ' semi'
	return pitch.toFixed(0) + ' semi'
}

export function adsrValueToString(ms: number) {
	if (ms < 0.01) return (ms * 1000).toFixed(2) + ' ms'
	if (ms < 0.1) return (ms * 1000).toFixed(1) + ' ms'
	if (ms < 1) return (ms * 1000).toFixed(0) + ' ms'
	if (ms < 10) return (ms).toFixed(2) + ' s'
	return (ms).toFixed(1) + ' s'
}

export const graphStateSaveLocalStorageKeyPrefix = 'localSave_'
export const graphStateSavesLocalStorageKey = 'localSaves'

export const handleClassName = 'handle'
export const handleVisualClassName = 'handleVisual'

export const limiterRenderSystemConstants = {
	width: 8,
	height: 40,
	id: 'masterVolumeLimiterCanvas',
	valueId: 'masterVolumeLimiterValueId',
} as const

export const pitchKnobSensitivity = 0.1
