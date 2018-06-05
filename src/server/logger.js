const logLevel = {
	log: true,
	debug: false,
}

module.exports.logger = {
	log: (...args) => {
		if (logLevel.log) {
			console.log(...args)
		}
	},
	debug: (...args) => {
		if (logLevel.debug) {
			console.debug(...args)
		}
	},
}
