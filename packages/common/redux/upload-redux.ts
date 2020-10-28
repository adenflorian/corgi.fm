import {Map} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, SERVER_ACTION, IClientAppState} from '.'

type UploadStatus = 'started' | 'unknown' | 'complete' | 'failed'

export const uploadActions = {
	setStatus: (parentId: AnimKey, childId: AnimKey, status: UploadStatus) => ({
		type: 'SET_UPLOAD_STATUS',
		parentId,
		childId,
		status,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
} as const

type AnimKey = Id | string | number

const makeUploadState = () =>
	Map<AnimKey, Map<AnimKey, UploadStatus>>()

interface UploadState extends ReturnType<typeof makeUploadState> {}

export type UploadAction = ActionType<typeof uploadActions>

export const uploadReducer = (
	state = makeUploadState(), action: UploadAction
): UploadState => {
	switch (action.type) {
		case 'SET_UPLOAD_STATUS':
			return state.setIn([action.parentId, action.childId], action.status)
		default: return state
	}
}

export function createUploadStatusSelector(
	parentId: AnimKey, childId: AnimKey,
) {
	return (state: IClientAppState): UploadStatus =>
		state.room.upload.getIn([parentId, childId], 'unknown')
}
