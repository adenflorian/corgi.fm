import {createReducer, makeActionCreator} from './redux-utils'

export const SET_MASTER_VOLUME = 'SET_MASTER_VOLUME'
export const setMasterVolume = makeActionCreator(SET_MASTER_VOLUME, 'volume')

export const SET_AUDIO_CONTEXT = 'SET_AUDIO_CONTEXT'
export const setAudioContext = makeActionCreator(SET_AUDIO_CONTEXT, 'context')

export const SET_PRE_FX = 'SET_PRE_FX'
export const setPreFx = makeActionCreator(SET_PRE_FX, 'preFx')

export interface IAudioState {
	masterVolume: number
	context: AudioContext
	preFx: GainNode
}

export const audioReducer = createReducer(
	{
		masterVolume: 0.1,
	},
	{
		[SET_MASTER_VOLUME]: (state: IAudioState, {volume}) => {
			return {
				...state,
				masterVolume: volume,
			}
		},
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
	},
)
