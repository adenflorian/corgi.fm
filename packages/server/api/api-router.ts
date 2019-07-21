import {usersResourcePathName} from '@corgifm/common/common-constants'
import * as Router from '@koa/router'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {usersRouter} from './users-router'

export const apiRouter = (
	serverStore: ServerStore,
	dbStore: DBStore,
): Router => {
	const router = new Router()

	const usersThing = usersRouter(serverStore, dbStore)

	router.use(
		'/' + usersResourcePathName,
		usersThing.routes(),
		usersThing.allowedMethods())

	router.all('/*', ctx => {
		ctx.status = 404

		ctx.body = {
			message: `couldn't find an api route matching ${ctx.method} ${ctx.path}`,
		}
	})

	return router
}
