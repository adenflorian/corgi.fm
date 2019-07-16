import {Reducer} from 'redux'

export const REPORT_LEVELS = 'REPORT_LEVELS'
type ReportLevelsAction = ReturnType<typeof reportLevels>
export const reportLevels = (master: number) => ({
	type: REPORT_LEVELS as typeof REPORT_LEVELS,
	master,
})

export interface IAudioState {
	reportedMasterLevel: number
}

const initialState: IAudioState = {
	reportedMasterLevel: 0,
}

export type AudioReduxAction = ReportLevelsAction

export const audioReducer: Reducer<IAudioState, AudioReduxAction> = (state = initialState, action) => {
	switch (action.type) {
		case REPORT_LEVELS:
			return {
				...state,
				reportedMasterLevel: action.master,
			}
		default: return state
	}
}
