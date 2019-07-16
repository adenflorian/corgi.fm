import {selectLocalClientId} from './clients-redux'
import {IClientAppState} from './common-redux-types'
import {selectRoomSettings} from './room-settings-redux'

export const selectIsLocalClientInLimitedMode = (state: IClientAppState) => {
	const roomSettings = selectRoomSettings(state.room)

	if (roomSettings.onlyOwnerCanDoStuff === false) return false

	const localClientId = selectLocalClientId(state)

	if (localClientId === roomSettings.ownerId) return false

	return true
}
