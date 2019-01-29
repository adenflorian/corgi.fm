import {assertArrayHasNoUndefinedElements} from './common-utils'
import {REPORT_LEVELS, SET_CLIENT_POINTER, SET_GLOBAL_CLOCK_INDEX, SET_INFO} from './redux'

export const actionsBlacklist = [
	SET_CLIENT_POINTER,
	REPORT_LEVELS,
	SET_INFO,
	SET_GLOBAL_CLOCK_INDEX,
]

// If anything is undefined in the blacklist the redux dev tools breaks
// TODO Create GitHub issue and do a PR to do this check in the dev tools
assertArrayHasNoUndefinedElements(actionsBlacklist)

export const maxRoomNameLength = 42
