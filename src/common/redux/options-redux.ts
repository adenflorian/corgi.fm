import {IClientAppState} from './index'
import {localStorageKey} from '../common-constants';
import {logger} from '../logger';
import {Store} from 'redux';

export enum AppOptions {
	masterVolume = 'masterVolume',
	showNoteNamesOnKeyboard = 'showNoteNamesOnKeyboard',
	requireCtrlToScroll = 'requireCtrlToScroll',
	showNoteSchedulerDebug = 'showNoteSchedulerDebug',
	renderNoteSchedulerDebugWhileStopped = 'renderNoteSchedulerDebugWhileStopped',
	enableEfficientMode = 'enableEfficientMode',
}

export const initialOptionsState = Object.freeze({
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

export type IOptionsState = typeof initialOptionsState

export function optionsReducer(state = initialOptionsState, action: SetOptionAction) {
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

export function loadOptionsState(): Readonly<IOptionsState> {
	try {
		const optionsJson = window.localStorage.getItem(localStorageKey)

		const fromLocalStorage = optionsJson
			? JSON.parse(optionsJson).options
			: {}

		const newState = Object.freeze({
			...initialOptionsState,
			...fromLocalStorage,
		})

		const newJson = JSON.stringify({options: newState})

		window.localStorage.setItem(localStorageKey, newJson)

		return newState
	} catch (e) {
		logger.error(e)
		logger.error('[loadOptionsState] resetting options...')

		window.localStorage.setItem(localStorageKey, JSON.stringify({options: initialOptionsState}))

		return initialOptionsState
	}
}

export function validateOptionsState(store: Store<IClientAppState>, loadedOptionsState: IOptionsState) {
	if (store.getState().options.masterVolume !== loadedOptionsState.masterVolume) {
		logger.error('something went wrong with loading options from localStorage');
		logger.error('store.getState().options: ', store.getState().options);
		logger.error('loadedOptionsState: ', loadedOptionsState);
	}
}

export const selectOptions = (state: IClientAppState) => state.options

export const selectOption = (state: IClientAppState, option: AppOptions) => selectOptions(state)[option]
