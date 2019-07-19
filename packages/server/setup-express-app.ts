import * as path from 'path'
import * as Sentry from '@sentry/node'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {logger} from '@corgifm/common/logger'
import {apiResourcePathName} from '@corgifm/common/common-constants'
import {apiRouter} from './api/api-router'
import {stateRouter} from './api/state-router'
import {DBStore} from './database/database'
import {isProdServer, isLocalDevServer} from './is-prod-server'
import {ServerStore} from './server-redux-types'

export async function setupExpressApp(
	serverStore: ServerStore,
	dbStore: DBStore,
) {
	const app: express.Application = express()

	app.use(Sentry.Handlers.requestHandler())

	app.use(cors())
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

	app.use(`/${apiResourcePathName}`, await apiRouter(serverStore, dbStore))

	app.get('/*', (req, res, next) => {
		res.sendFile(path.join(__dirname, isLocalDevServer()
			? '../client/index.html'
			: '../public/index.html'))
	})

	app.all('/*', (req, res) => {
		res.status(404).json({
			message: `couldn't find a route matching ${req.method} ${req.path}`,
		})
	})

	app.use(Sentry.Handlers.errorHandler())

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	app.use((
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		// The error id is attached to `res.sentry` to be returned
		// and optionally displayed to the user for support.
		logger.error('unhandled express error: ', {err})

		return res.status(500).json({
			message: `something borked, here is an error code `
				+ `that the support people might`
				// @ts-ignore
				+ `find useful: ${res.sentry}`,
		})
	})

	return app
}
