// tslint:disable:no-console
const logLevel = {
	log: true,
	debug: true,
	warn: true,
}

export const logger = {
	log: (...args) => {
		if (logLevel.log) {
			console.log(...args)
		}
	},
	warn: (...args) => {
		if (logLevel.warn) {
			console.warn(...args)
		}
	},
	debug: (...args) => {
		if (logLevel.debug) {
			console.log(...args)
		}
	},
}
