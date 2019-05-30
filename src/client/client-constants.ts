import {stripIndent} from 'common-tags'

export const mainBoardsId = 'mainBoards'
export const zoomBackgroundClass = 'zoomBackground'
export const backgroundMenuId = 'backgroundMenuId'
export const nodeMenuId = 'nodeMenuId'
export const panToolTip = stripIndent`
	panning
	controls how far left and right the sound is
`
export const lpfToolTip = stripIndent`
	low pass filter
	removes the higher frequencies
`
export const gainToolTip = stripIndent`
	gain (volume)
	1 is 0 db and 0 is -infinite db
`
export const attackToolTip = stripIndent`
	attack time in seconds
	the time between starting a note and it reaching max volume
`
export const decayToolTip = stripIndent`
	decay time in seconds
	the time it takes from the end of the attack until the sustain volume
`
export const sustainToolTip = stripIndent`
	amplitude of note after decay
`
export const releaseToolTip = stripIndent`
	release time in seconds
	the time between releasing a note and the amplitude reaching 0
`
export const filterAttackToolTip = stripIndent`
	attack time in seconds
`
export const filterDecayToolTip = stripIndent`
	decay time in seconds
`
export const filterSustainToolTip = stripIndent`
	amount of filter to apply?
`
export const filterReleaseToolTip = stripIndent`
	release time in seconds
`
export const detuneToolTip = stripIndent`
	detune in percentage of a half step
	fine grained pitch control, where 100% is 1 half step above the current note
`
export const sequencerGateToolTip = stripIndent`
	controls note length
`
export const sequencerPitchToolTip = stripIndent`
	controls note midi pitch in half steps
`
export const sequencerRateToolTip = stripIndent`
	makes sequence go faster or slower
`
export const graphSizeX = 12800
export const graphSizeY = 7200

export const longLineTooltip = 'right click to delete'

export function panValueToString(pan: number) {
	if (pan === 0) return 'C'
	if (pan < 0) return Math.abs(pan).toFixed(2) + ' L'
	return pan.toFixed(2) + ' R'
}

export function filterValueToString(frequencyHz: number) {
	return frequencyHz.toFixed(0) + ' Hz'
}

export function detuneValueToString(detune: number) {
	return detune.toFixed(0) + ' cents'
}

export function seqGateValueToString(pitch: number) {
	return pitch.toFixed(2).replace(/\.00$/, '')
}

export function seqRateValueToString(rate: number) {
	if (rate > 1) return rate.toFixed(0) + ' bars'
	if (rate === 1) return rate.toFixed(0) + ' bar'
	return '1/' + (1 / rate)
}

export function seqPitchValueToString(pitch: number) {
	if (pitch > 0) return '+' + pitch.toFixed(0) + ' semitones'
	return pitch.toFixed(0) + ' semitones'
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
