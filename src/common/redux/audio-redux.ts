import {createReducer, makeActionCreator} from './redux-utils'

export const SET_AUDIO_CONTEXT = 'SET_AUDIO_CONTEXT'
export const setAudioContext = makeActionCreator(SET_AUDIO_CONTEXT, 'context')

export const SET_PRE_FX = 'SET_PRE_FX'
export const setPreFx = makeActionCreator(SET_PRE_FX, 'preFx')

export const REPORT_LEVELS = 'REPORT_LEVELS'
export const reportLevels = makeActionCreator(REPORT_LEVELS, 'master')

export interface IAudioState {
	context: AudioContext
	preFx: GainNode
	reportedMasterLevel: number
}

export const audioReducer = createReducer(
	{
	},
	{
		[SET_AUDIO_CONTEXT]: (state: IAudioState, {context}) => {
			return {
				...state,
				context,
			}
		},
		[SET_PRE_FX]: (state: IAudioState, {preFx}) => {
			return {
				...state,
				preFx,
			}
		},
		[REPORT_LEVELS]: (state: IAudioState, {master}) => {
			return {
				...state,
				reportedMasterLevel: master,
			}
		},
	},
)
