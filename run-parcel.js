const Bundler = require('parcel-bundler')
const express = require('express')
const parcelWrapper = require('parcel-plugin-wrapper')

const entryFiles = [
	'packages/client/index.html',
	'packages/client/WebAudio/AudioWorklets/Processors/*.ts',
	'packages/client/WebWorkers/Workers/*.ts',
]

/** @typedef {import('parcel-bundler').ParcelOptions} ParcelOptions */

/** @type {ParcelOptions} */
const options = {}

const bundler = new Bundler(entryFiles, options)

parcelWrapper(bundler)

// bundler.on('bundled', bundle => {
// 	console.log({bundle, childBundles: bundle.childBundles})
// })

// bundler.on('buildEnd', () => {
// 	console.log('buildEnd')
// })

const app = express()

app.get('/*', (req, res, next) => {
	if (!req.url.includes('.')) {
		req.url = '/index.html'
	}
	next()
})

app.use(bundler.middleware())

const port = Number(process.env.PORT || 80)
app.listen(port)
console.log(`listening at http://localhost:${port}`)
