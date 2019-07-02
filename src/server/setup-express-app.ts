import * as cors from 'cors'
import * as express from 'express'
import * as path from 'path'
import {apiRouter} from './api/api-router'
import {stateRouter} from './api/state-router'
import {isProdServer} from './is-prod-server'
import {ServerStore} from './server-redux-types'

export function setupExpressApp(app: express.Application, serverStore: ServerStore) {
	app.use(cors())
	app.use(express.static(path.join(__dirname, '../public')))

	app.get('/newsletter', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/newsletter.html'))
	})

	if (!isProdServer()) {
		app.use('/state', stateRouter(serverStore))
	}

	app.use('/api', apiRouter(serverStore))

	app.get('/*', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})
}
