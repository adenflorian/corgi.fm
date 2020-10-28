const path = require('path')
const logger = require('@parcel/logger')

const CWD = process.cwd()
const PACKAGE = require(path.join(CWD, 'package.json'))

// Found here: https://github.com/parcel-bundler/parcel/issues/1401
// Workaround for parcel issue with loading modules
// We need it because of the way we load audio worklet stuff

/** @param stuff {{name: string, bundler: any}} */
const varRequire = async ({name, bundler}) => {
	// name = app.ere76r5e76r5e76r.js
	// logger.log('AAA bundler.options.production: ' + bundler.options.production)
	// logger.log('name: ' + name)
	if (name && (
		name.match(/WebAudio.AudioWorklets.Processors.*js$/) ||
		name.match(/WebWorkers.Workers.*js$/)
	)) {
		logger.log('transforming: ' + name)
		return {
			header: `var parcelRequire = undefined;`,
			footer: ``
		}
	}
}

module.exports = varRequire
