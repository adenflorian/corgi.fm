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
import {isProdServer} from './is-prod-server'
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

	app.use(`/${apiResourcePathName}`, await apiRouter(serverStore, dbStore))

	app.get('/*', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})

	app.use(Sentry.Handlers.errorHandler())

	app.use(async function onError(err: any, req: express.Request, res: any, next: any) {
		// The error id is attached to `res.sentry` to be returned
		// and optionally displayed to the user for support.
		logger.error('unhandled express error: ', err)
		res.statusCode = 500
		return res.end(`something borked, here is an error code that the support people might find useful: ${res.sentry}`)
	})

	return app
}
