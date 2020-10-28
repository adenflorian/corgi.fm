import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {SampleUpload} from '../models/OtherModels'
import {IClientAppState} from './common-redux-types'
import {AuthAction} from './auth-redux'

export const localUserActions = {
	setSamples: (userSamples: SampleUpload[]) => ({
		type: 'SET_LOCAL_USER_SAMPLES',
		userSamples,
	} as const),
} as const

const makeLocalUserState = Record({
	userSamples: [] as SampleUpload[],
})

export class LocalUserState extends makeLocalUserState {}

export type LocalUserAction = ActionType<typeof localUserActions>

export const localUserReducer = (
	state = new LocalUserState(), action: LocalUserAction | AuthAction
): LocalUserState => {
	switch (action.type) {
		case 'SET_LOCAL_USER_SAMPLES': return state.set('userSamples', action.userSamples)
		case 'AUTH_ON_LOG_OUT': return new LocalUserState()
		case 'AUTH_ON_LOG_IN': return new LocalUserState()
		default: return state
	}
}

// Selectors
export const selectLocalUserState = (state: IClientAppState) => state.localUser

// Selectors
export const selectLocalUserSamples = (state: IClientAppState) =>
	state.localUser.userSamples
