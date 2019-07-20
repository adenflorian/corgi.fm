import {selectAllClients} from '@corgifm/common/redux'
// import {validateOrReject} from 'class-validator'
// import {User} from '@corgifm/common/models/User'
// import {plainToClass} from 'class-transformer'
import * as Router from '@koa/router'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'

export const usersRouter = (
	serverStore: ServerStore,
	dbStore: DBStore,
): Router => {
	const router = new Router()

	router.get(`/count`, ctx => {
		ctx.body = selectAllClients(serverStore.getState()).length
	})

	router.get('/:userId', ctx => {
		// if missing userId return 400
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		ctx.status = 404
		ctx.body = {
			message: `userNotFound`,
		}
	})

	router.put('/:userId', ctx => {
		// const user = plainToClass(User, body)

		// await validateOrReject(user, {validationError: {target: false}})
		// 	.catch(next)

		// if missing userId return 400
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		ctx.status = 501
		ctx.body = {
			message: `userNotFound`,
		}
	})

	return router
}
