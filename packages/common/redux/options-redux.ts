import {Store} from 'redux'
import {localStorageKey} from '../common-constants'
import {logger} from '../logger'
import {IClientAppState} from '.'

export enum AppOptions {
	masterVolume = 'masterVolume',
	masterVolumeMute = 'masterVolumeMute',
	showNoteNamesOnKeyboard = 'showNoteNamesOnKeyboard',
	requireCtrlToScroll = 'requireCtrlToScroll',
	showNoteSchedulerDebug = 'showNoteSchedulerDebug',
	renderNoteSchedulerDebugWhileStopped = 'renderNoteSchedulerDebugWhileStopped',
	graphicsFancyConnections = 'graphicsFancyConnections',
	graphicsECS = 'graphicsECS',
	graphicsExpensiveZoomPan = 'graphicsExpensiveZoomPan',
}

export const initialOptionsState = Object.freeze({
	showNoteNamesOnKeyboard: true,
	masterVolume: 0.1,
	masterVolumeMute: false,
	requireCtrlToScroll: false,
	showNoteSchedulerDebug: false,
	renderNoteSchedulerDebugWhileStopped: true,
	graphicsFancyConnections: false,
	graphicsECS: true,
	graphicsExpensiveZoomPan: true,
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

export function optionsReducer(state = initialOptionsState, action: SetOptionAction): IOptionsState {
	switch (action.type) {
		case SET_OPTION: {
			const newState = getNewState(state, action)
			window.localStorage.setItem(localStorageKey, JSON.stringify({options: newState}))
			return newState
		}
		default: return state
	}
}

function getNewState(state: IOptionsState, action: SetOptionAction): IOptionsState {
	return Object.freeze({
		...state,
		[action.option]: action.value,
	})
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
	} catch (error) {
		logger.error(error)
		logger.error('[loadOptionsState] resetting options...')

		window.localStorage.setItem(localStorageKey, JSON.stringify({options: initialOptionsState}))

		return initialOptionsState
	}
}

export function validateOptionsState(store: Store<IClientAppState>, loadedOptionsState: IOptionsState) {
	if (store.getState().options.masterVolume !== loadedOptionsState.masterVolume) {
		logger.error('something went wrong with loading options from localStorage')
		logger.error('store.getState().options: ', store.getState().options)
		logger.error('loadedOptionsState: ', loadedOptionsState)
	}
}

export const selectOptions = (state: IClientAppState) => state.options

export const selectOption = (state: IClientAppState, option: AppOptions) => {
	return selectOptions(state)[option]
}
