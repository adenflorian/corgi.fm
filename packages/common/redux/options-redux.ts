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
	graphicsMultiColoredConnections = 'graphicsMultiColoredConnections',
	graphicsECS = 'graphicsECS',
	graphicsExpensiveZoomPan = 'graphicsExpensiveZoomPan',
	graphicsExtraAnimations = 'graphicsExtraAnimations',
	enableAudioWorklet = 'enableAudioWorklet',
	enableWireShadows = 'enableWireShadows',
}

export const initialOptionsState = Object.freeze({
	showNoteNamesOnKeyboard: true,
	masterVolume: 0.1,
	masterVolumeMute: false,
	requireCtrlToScroll: false,
	showNoteSchedulerDebug: false,
	renderNoteSchedulerDebugWhileStopped: true,
	graphicsFancyConnections: false,
	graphicsMultiColoredConnections: true,
	graphicsECS: true,
	graphicsExpensiveZoomPan: true,
	graphicsExtraAnimations: false,
	enableAudioWorklet: false,
	enableWireShadows: true,
})

type SetOptionAction = ReturnType<typeof setOption>
export const setOption = (option: AppOptions, value: any) => ({
	type: 'SET_OPTION',
	option,
	value,
} as const)

export type OptionsAction = SetOptionAction

export const setOptionMasterVolume = setOption.bind(null, AppOptions.masterVolume)

export type IOptionsState = typeof initialOptionsState

// TODO Move to client package
export function optionsReducer(state = initialOptionsState, action: OptionsAction): IOptionsState {
	switch (action.type) {
		case 'SET_OPTION': {
			const newState = getNewState(state, action)
			window.localStorage.setItem(localStorageKey, JSON.stringify({options: newState}))
			return newState
		}
		default: return state
	}
}

function getNewState(state: IOptionsState, action: OptionsAction): IOptionsState {
	return {
		...state,
		[action.option]: action.value,
	}
}

export function loadOptionsState(): IOptionsState {
	try {
		const optionsJson = window.localStorage.getItem(localStorageKey)

		const fromLocalStorage = optionsJson
			? JSON.parse(optionsJson).options
			: {}

		const newState: IOptionsState = {
			...initialOptionsState,
			...fromLocalStorage,
		}

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

export const createOptionSelector = (option: AppOptions) => (state: IClientAppState) => {
	return selectOptions(state)[option]
}
