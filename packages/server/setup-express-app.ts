import * as path from 'path'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as Sentry from '@sentry/node'
import {stateRouter} from './api/state-router'
import {DBStore} from './database/database'
import {isProdServer, isLocalDevServer, getOrigin} from './is-prod-server'
import {ServerStore} from './server-redux-types'
import {handleError} from './api-error'
import {apiRouter} from './api/api-router'
import {Method} from './api/api-types'

export async function setupExpressApp(
	serverStore: ServerStore,
	dbStore: DBStore,
) {
	const app: express.Application = express()

	app.use(Sentry.Handlers.requestHandler())

	app.use(cors({origin: getOrigin(), methods: [Method.GET, Method.PUT]}))

	app.use(bodyParser.json())

	app.use(express.static(path.join(__dirname, '../public')))

	// TODO Is this need since we are using the static middleware above?
	app.get('/newsletter', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/newsletter.html'))
	})

	if (!isProdServer()) {
		app.use('/state', stateRouter(serverStore))
	}

	if (isLocalDevServer()) {
		app.get('/error', () => {
			throw new Error('test error please ignore')
		})
	}

	app.use('/api', apiRouter(serverStore, dbStore))

	app.get('/*', (req, res, next) => {
		res.sendFile(path.join(__dirname, isLocalDevServer()
			? '../client/index.html'
			: '../public/index.html'))
	})

	app.all('/*', (req, res, next) => {
		return res.status(404).json({
			message: `couldn't find a route matching ${req.method} ${req.path}`,
		})
	})

	app.use(Sentry.Handlers.errorHandler())

	app.use(handleError)

	return app
}
