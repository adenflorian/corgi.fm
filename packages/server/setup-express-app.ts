import * as path from 'path'
import * as Sentry from '@sentry/node'
import * as Koa from 'koa'
import {logger} from '@corgifm/common/logger'
import {apiResourcePathName} from '@corgifm/common/common-constants'
import * as cors from '@koa/cors'
import * as Router from '@koa/router'
import * as send from 'koa-send'
import * as serve from 'koa-static'
import {stateRouter} from './api/state-router'
import {apiRouter} from './api/api-router'
import {DBStore} from './database/database'
import {isProdServer, isLocalDevServer} from './is-prod-server'
import {ServerStore} from './server-redux-types'

export async function setupExpressApp(
	serverStore: ServerStore,
	dbStore: DBStore,
) {
	const app = new Koa()
	const router = new Router()

	app.use(async (ctx, next) => {
		try {
			await next()
		} catch (error) {
			logger.error('unhandled api error: ', {error})

			Sentry.withScope(scope => {
				scope.addEventProcessor(event => {
					return Sentry.Handlers.parseRequest(event, ctx.request)
				})

				const errorCode = Sentry.captureException(error)

				ctx.status = error.statusCode || error.status || 500

				ctx.body = {
					message: `something borked, here is an error code `
						+ `that the support people might`
						+ `find useful: ${errorCode}`,
				}
			})
		}
	})

	app.use(cors({origin: '*'}))
	// app.use(bodyParser.json())

	// TODO Use extensions options when github issue is resolved
	app.use(serve(path.join(__dirname, '../public')))

	// TODO Is this need since we are using the static middleware above?
	router.get('/newsletter', async ctx => {
		await send(
			ctx, '/newsletter.html', {root: path.join(__dirname, '../public')})
	})

	if (!isProdServer()) {
		const stateThing = stateRouter(serverStore)
		router.use('/state', stateThing.routes(), stateThing.allowedMethods())
	}

	if (isLocalDevServer()) {
		router.get('/error', () => {
			throw new Error('test error please ignore')
		})
	}

	const apiThing = apiRouter(serverStore, dbStore)

	router.use(`/${apiResourcePathName}`,
		apiThing.routes(), apiThing.allowedMethods())

	router.get('/*', async (ctx, next) => {
		await send(ctx, '/index.html', {
			root: path.join(__dirname, isLocalDevServer()
				? '../client'
				: '../public'),
		})
	})

	router.all('/*', ctx => {
		ctx.status = 404

		ctx.body = {
			message: `couldn't find a route matching ${ctx.method} ${ctx.path}`,
		}
	})

	app
		.use(router.routes())
		.use(router.allowedMethods())

	return app
}
