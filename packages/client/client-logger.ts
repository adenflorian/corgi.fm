import {logger as commonLogger} from '@corgifm/common/logger'
import {eventError} from './analytics/analytics'

export const logger = {
	error: (...args: any[]) => {
		commonLogger.error(...args)
		eventError({
			description: args[0].toString(),
			fatal: true,
		})
	},
	warn: (...args: any[]) => {
		commonLogger.warn(...args)
		eventError({
			description: args[0].toString(),
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
	assert: (value: any, message?: string, ...optionalParams: any[]) => {
		commonLogger.assert(value, message, optionalParams)
	},
}
