import {createReducer, makeActionCreator} from './redux-utils'

export const REPORT_LEVELS = 'REPORT_LEVELS'
export const reportLevels = makeActionCreator(REPORT_LEVELS, 'master')

export interface IAudioState {
	reportedMasterLevel: number
}

const initialState: IAudioState = {
	reportedMasterLevel: 0,
}

export const audioReducer = createReducer(
	initialState,
	{
		[REPORT_LEVELS]: (state: IAudioState, {master}) => {
			return {
				...state,
				reportedMasterLevel: master,
			}
		},
	},
)
