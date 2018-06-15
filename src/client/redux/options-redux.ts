import {createReducer} from './redux-utils'

export const AppOptions = Object.freeze({
	masterVolume: 'masterVolume',
	showNoteNamesOnKeyboard: 'showNoteNamesOnKeyboard',
})

export const SET_OPTION = 'SET_OPTION'
export const setOption = (option: string, value: any) => ({
	type: SET_OPTION,
	option,
	value,
})

export const setOptionShowNoteNames = setOption.bind(this, AppOptions.showNoteNamesOnKeyboard)
export const setOptionMasterVolume = setOption.bind(this, AppOptions.masterVolume)

export interface IOptionsState {
	showNoteNamesOnKeyboard: boolean
	masterVolume: number
}

export const optionsReducer = createReducer(
	{
		showNoteNamesOnKeyboard: true,
		masterVolume: 0.1,
	},
	{
		[SET_OPTION]: (state: IOptionsState, {option, value}) => {
			return {
				...state,
				[option]: value,
			}
		},
	},
)
