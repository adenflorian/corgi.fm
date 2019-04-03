import {stripIndent} from 'common-tags';

export const mainBoardsId = 'mainBoards'
export const zoomBackgroundClass = 'zoomBackground'
export const backgroundMenuId = 'backgroundMenuId'
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
