import * as path from 'path'
import * as Koa from 'koa'
import * as cors from '@koa/cors'
import * as Router from '@koa/router'
import * as send from 'koa-send'
import * as serve from 'koa-static'
import * as bodyParser from 'koa-bodyparser'
import {Header} from '@corgifm/common/common-types'
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
	const app = new Koa()
	const router = new Router()

	app.use(handleError)

	app.use(cors({origin: getOrigin(), allowMethods: [Method.GET, Method.PUT]}))

	app.use(bodyParser())

	// TODO Use extensions options when github issue is resolved
	app.use(
		serve(
			path.join(__dirname, '../public'),
			{
				setHeaders: res => {
					res.setHeader(Header.CacheControl, 'public, max-age=0')
				},
			}
		)
	)

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

	router.use('/api', apiRouter(serverStore, dbStore))

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
