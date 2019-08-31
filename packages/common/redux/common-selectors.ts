import {ConnectionNodeType} from '../common-types'
import {logger} from '../logger'
import {
	selectVirtualKeyboardById, selectPositionsByOwnerAndType,
	selectRoomSettings, IClientAppState, IClientRoomState, selectLocalClientId,
} from '.'

export const selectIsLocalClientInLimitedMode = (state: IClientAppState) => {
	const roomSettings = selectRoomSettings(state.room)

	if (roomSettings.onlyOwnerCanDoStuff === false) return false

	const localClientId = selectLocalClientId(state)

	if (localClientId === roomSettings.ownerId) return false

	return true
}

export function selectVirtualKeyboardCountByOwner(state: IClientRoomState, ownerId: ClientId): number {
	return selectPositionsByOwnerAndType(state, ownerId, ConnectionNodeType.virtualKeyboard).count()
}

export function selectVirtualKeyboardByOwner(state: IClientRoomState, ownerId: ClientId) {
	const keyboardId = selectKeyboardIdByOwner(state, ownerId)

	return selectVirtualKeyboardById(state, keyboardId)
}

function selectKeyboardIdByOwner(state: IClientRoomState, ownerId: Id): Id {
	const positions = selectPositionsByOwnerAndType(state, ownerId, ConnectionNodeType.virtualKeyboard)

	if (positions.count() > 1) {
		logger.error('[selectVirtualKeyboardByOwner] positions.count() > 1')
	}

	return positions.first({id: 'dummy123'})!.id
}
