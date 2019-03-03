import {createReducer, IClientAppState} from './index'

export enum AppOptions {
	masterVolume = 'masterVolume',
	showNoteNamesOnKeyboard = 'showNoteNamesOnKeyboard',
	requireCtrlToScroll = 'requireCtrlToScroll',
	showSynthNoteSchedulerDebug = 'showSynthNoteSchedulerDebug',
}

export const SET_OPTION = 'SET_OPTION'
export type SetOptionAction = ReturnType<typeof setOption>
export const setOption = (option: AppOptions, value: any) => ({
	type: SET_OPTION,
	option,
	value,
})

export const setOptionShowNoteNames = setOption.bind(null, AppOptions.showNoteNamesOnKeyboard)
export const setOptionMasterVolume = setOption.bind(null, AppOptions.masterVolume)
export const setOptionRequireCtrlToZoom = setOption.bind(null, AppOptions.requireCtrlToScroll)
export const setOptionShowSynthNoteSchedulerDebug = setOption.bind(null, AppOptions.showSynthNoteSchedulerDebug)

export type IOptionsState = typeof initialState

const initialState = {
	showNoteNamesOnKeyboard: true,
	masterVolume: 0.1,
	requireCtrlToScroll: true,
	showSynthNoteSchedulerDebug: false,
}

export const optionsReducer = createReducer(initialState, {
	[SET_OPTION]: (state, {option, value}: SetOptionAction) => ({
		...state,
		[option]: value,
	}),
})

export const selectOptions = (state: IClientAppState) => state.options

export const selectOption = (state: IClientAppState, option: AppOptions) => selectOptions(state)[option]
