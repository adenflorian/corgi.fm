// tslint:disable:no-console
const logLevel = {
	log: true,
	warn: true,
	debug: true,
	trace: false,
}

export const logger = {
	log: (...args: any[]) => {
		if (logLevel.log) {
			console.log(...args)
		}
	},
	warn: (...args: any[]) => {
		if (logLevel.warn) {
			console.warn(...args)
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
