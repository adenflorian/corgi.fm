export const SET_AUDIO_CONTEXT = 'SET_AUDIO_CONTEXT'

export function setAudioContext(audioContext) {
	return {
		type: SET_AUDIO_CONTEXT,
		audioContext,
	}
}

export function audioContextReducer(state = {}, action) {
	switch (action.type) {
		case SET_AUDIO_CONTEXT:
			return {
				...state,
				audioContext: action.audioContext,
			}
		default:
			return state
	}
}
