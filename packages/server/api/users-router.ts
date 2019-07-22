import {selectAllClients} from '@corgifm/common/redux'
import {User} from '@corgifm/common/models/User'
import * as Router from '@koa/router'
import {Context} from 'koa'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {requireEmailVerifiedUser, checkUid} from '../security-middleware'
import {validate} from '../server-validation'

export const usersRouter = (
	serverStore: ServerStore,
	dbStore: DBStore,
): Router => {

	const secureRouter = new Router()
		.use(requireEmailVerifiedUser)
		.get('/:uid', checkUid, getUser)
		.put('/:uid', checkUid, validate(User, putUser))

	const publicRouter = new Router()
		.get(`/count`, getCount)
		.use(secureRouter.routes(), secureRouter.allowedMethods())

	return publicRouter

	async function getCount(ctx: Context) {
		ctx.body = selectAllClients(serverStore.getState()).length
	}

	async function getUser(ctx: Context) {
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		ctx.status = 404
		ctx.body = {
			message: `userNotFound`,
		}
	}

	async function putUser(ctx: Context, user: User) {
		// save to DB and return 200
		ctx.status = 501

		ctx.body = {
			user: user.displayName.toUpperCase(),
		}
	}
}
