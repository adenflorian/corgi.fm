import {eventError} from './analytics/analytics'
import {logger as commonLogger} from '@corgifm/common/logger'

export const logger = {
	error: (...args: any[]) => {
		commonLogger.error(...args)
		eventError({
			description: args[0],
			fatal: true,
		})
	},
	warn: (...args: any[]) => {
		commonLogger.warn(...args)
		eventError({
			description: args[0],
			fatal: false,
		})
	},
	log: (...args: any[]) => {
		commonLogger.log(...args)
	},
	debug: (...args: any[]) => {
		commonLogger.log(...args)
	},
	trace: (...args: any[]) => {
		commonLogger.log(...args)
	},
}
