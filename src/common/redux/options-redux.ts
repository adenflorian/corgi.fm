import {createReducer} from './redux-utils'

export const AppOptions = Object.freeze({
	masterVolume: 'masterVolume',
	showNoteNamesOnKeyboard: 'showNoteNamesOnKeyboard',
})

export const SET_OPTION = 'SET_OPTION'
export type SetOptionAction = ReturnType<typeof setOption>
export const setOption = (option: string, value: any) => ({
	type: SET_OPTION,
	option,
	value,
})

export const setOptionShowNoteNames = setOption.bind(null, AppOptions.showNoteNamesOnKeyboard)
export const setOptionMasterVolume = setOption.bind(null, AppOptions.masterVolume)

export interface IOptionsState {
	showNoteNamesOnKeyboard: boolean
	masterVolume: number
}

export type AppOption = 'masterVolume' | 'showNoteNamesOnKeyboard'

const initialState: IOptionsState = {
	showNoteNamesOnKeyboard: true,
	masterVolume: 0.1,
}

export const optionsReducer = createReducer(initialState, {
	[SET_OPTION]: (state, {option, value}: SetOptionAction) => ({
		...state,
		[option]: value,
	}),
})
