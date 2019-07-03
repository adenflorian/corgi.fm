import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as path from 'path'
import {apiRouter} from './api/api-router'
import {stateRouter} from './api/state-router'
import {DBStore} from './database/database'
import {isProdServer} from './is-prod-server'
import {ServerStore} from './server-redux-types'

export function setupExpressApp(serverStore: ServerStore, dbStore: DBStore) {
	const app: express.Application = express()

	app.use(cors())
	app.use(bodyParser.json())

	app.use(express.static(path.join(__dirname, '../public')))

	app.get('/newsletter', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/newsletter.html'))
	})

	if (!isProdServer()) {
		app.use('/state', stateRouter(serverStore))
	}

	app.use('/api', apiRouter(serverStore, dbStore))

	app.get('/*', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})

	return app
}
