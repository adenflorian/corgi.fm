import {AnyAction} from 'redux'

export interface IDawState {
	tracks: ITrack[]
}

export interface ITrack {
	name: string
	notes: IDawNote[]
}

export interface IDawNote {
	start: number
	duration: number
	note: number
}

export function dawReducer(state = {}, action: AnyAction) {
	switch (action.type) {
		default: return state
	}
}
