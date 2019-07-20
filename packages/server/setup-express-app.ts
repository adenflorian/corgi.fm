import * as path from 'path'
import * as Koa from 'koa'
import {apiResourcePathName} from '@corgifm/common/common-constants'
import * as cors from '@koa/cors'
import * as Router from '@koa/router'
import * as send from 'koa-send'
import * as serve from 'koa-static'
import * as bodyParser from 'koa-bodyparser'
import {stateRouter} from './api/state-router'
import {apiRouter} from './api/api-router'
import {DBStore} from './database/database'
import {isProdServer, isLocalDevServer} from './is-prod-server'
import {ServerStore} from './server-redux-types'
import {handleError} from './api-error'

export async function setupExpressApp(
	serverStore: ServerStore,
	dbStore: DBStore,
) {
	const app = new Koa()
	const router = new Router()

	app.use(handleError)

	app.use(cors({origin: '*'}))
	app.use(bodyParser())

	// TODO Use extensions options when github issue is resolved
	app.use(serve(path.join(__dirname, '../public')))

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
