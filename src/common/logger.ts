import {eventError} from '../client/analytics'

// tslint:disable:no-console
const logLevel = {
	error: true,
	warn: true,
	log: true,
	debug: false,
	trace: false,
}

export const logger = {
	error: (...args: any[]) => {
		if (logLevel.error) {
			console.error(...args)
		}
		eventError({
			description: args[0],
			fatal: true,
		})
	},
	warn: (...args: any[]) => {
		if (logLevel.warn) {
			console.warn(...args)
		}
		eventError({
			description: args[0],
			fatal: false,
		})
	},
	log: (...args: any[]) => {
		if (logLevel.log) {
			console.log(...args)
		}
	},
	debug: (...args: any[]) => {
		if (logLevel.debug) {
			console.log(...args)
		}
	},
	trace: (...args: any[]) => {
		if (logLevel.trace) {
			console.log(...args)
		}
	},
}
