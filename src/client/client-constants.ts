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
	the time between starting a note and the amplitude reaching the sustain
`
export const releaseToolTip = stripIndent`
	release time in seconds
	the time between releasing a note and the amplitude reaching 0
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
export const graphSizeX = 12800
export const graphSizeY = 7200

export const longLineTooltip = 'right click to delete'

export function panValueToString(pan: number) {
	if (pan === 0) return 'C'
	if (pan < 0) return Math.abs(pan).toFixed(2) + ' L'
	return pan.toFixed(2) + ' R'
}

export function filterValueToString(frequencyHz: number) {
	return (frequencyHz / 1000).toFixed(0) + ' kHz'
}

export function adsrValueToString(ms: number) {
	if (ms < 0.01) return (ms * 1000).toFixed(2) + ' ms'
	if (ms < 0.1) return (ms * 1000).toFixed(1) + ' ms'
	if (ms < 1) return (ms * 1000).toFixed(0) + ' ms'
	if (ms < 10) return (ms).toFixed(2) + ' s'
	return (ms).toFixed(1) + ' s'
}
