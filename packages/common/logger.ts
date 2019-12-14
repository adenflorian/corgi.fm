/* eslint-disable no-console */
const logLevel = {
	error: true,
	warn: true,
	log: true,
	debug: false,
	trace: false,
	assert: true,
}

let enabled = true

export const logger = {
	error: (...args: any[]) => {
		if (logLevel.error && enabled) {
			console.error(...args)
		}
	},
	warn: (...args: any[]) => {
		if (logLevel.warn && enabled) {
			console.warn(...args)
		}
	},
	log: (...args: any[]) => {
		if (logLevel.log && enabled) {
			console.log(...args)
		}
	},
	debug: (...args: any[]) => {
		if (logLevel.debug && enabled) {
			console.log(...args)
		}
	},
	trace: (...args: any[]) => {
		if (logLevel.trace && enabled) {
			console.log(...args)
		}
	},
	enable: () => {
		enabled = true
	},
	disable: () => {
		enabled = false
	},
	isEnabled: () => enabled,
	assert: (value: any, message?: string, ...optionalParams: any[]) => {
		if (logLevel.assert && enabled) {
			console.assert(value, message, optionalParams)
		}
	},
}
