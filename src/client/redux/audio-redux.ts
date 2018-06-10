import {createReducer, makeActionCreator} from './redux-utils'

export const SET_MASTER_VOLUME = 'SET_MASTER_VOLUME'
export const setMasterVolume = makeActionCreator(SET_MASTER_VOLUME, 'volume')

export interface IAudioState {
	masterVolume: number
}

export const audioReducer = createReducer(
	{
		masterVolume: 0.1,
	},
	{
		[SET_MASTER_VOLUME]: (state, {volume}) => {
			return {
				...state,
				masterVolume: volume,
			}
		},
	},
)
