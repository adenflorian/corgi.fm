import {logger} from '../logger'
import {IClientAppState} from './index'

export enum AppOptions {
	masterVolume = 'masterVolume',
	showNoteNamesOnKeyboard = 'showNoteNamesOnKeyboard',
	requireCtrlToScroll = 'requireCtrlToScroll',
	showNoteSchedulerDebug = 'showNoteSchedulerDebug',
	renderNoteSchedulerDebugWhileStopped = 'renderNoteSchedulerDebugWhileStopped',
	enableEfficientMode = 'enableEfficientMode',
}

const initialState = Object.freeze({
	showNoteNamesOnKeyboard: true,
	masterVolume: 0.1,
	requireCtrlToScroll: false,
	showNoteSchedulerDebug: false,
	renderNoteSchedulerDebugWhileStopped: true,
	enableEfficientMode: false,
})

export const SET_OPTION = 'SET_OPTION'
export type SetOptionAction = ReturnType<typeof setOption>
export const setOption = (option: AppOptions, value: any) => ({
	type: SET_OPTION,
	option,
	value,
})

export const setOptionMasterVolume = setOption.bind(null, AppOptions.masterVolume)

export type IOptionsState = typeof initialState

const localStorageKey = 'redux'

export function optionsReducer(state: IOptionsState | undefined = initialState, action: SetOptionAction) {
	if (action.type === '@@INIT' || state === undefined) {
		try {
			const optionsJson = window.localStorage.getItem(localStorageKey)
			const fromLocalStorage = optionsJson
				? JSON.parse(optionsJson).options
				: {}
			const newState = {
				...initialState,
				...fromLocalStorage,
			}
			const newJson = JSON.stringify({options: newState})
			window.localStorage.setItem(localStorageKey, newJson)
			return newState
		} catch (e) {
			logger.error(e)
			logger.error('resetting options...')
			window.localStorage.setItem(localStorageKey, JSON.stringify({options: initialState}))
			return initialState
		}
	}
	switch (action.type) {
		case SET_OPTION: {
			const newState = {
				...state,
				[action.option]: action.value,
			}
			window.localStorage.setItem(localStorageKey, JSON.stringify({options: newState}))
			return newState
		}
		default: return state
	}
}

export const selectOptions = (state: IClientAppState) => state.options

export const selectOption = (state: IClientAppState, option: AppOptions) => selectOptions(state)[option]
