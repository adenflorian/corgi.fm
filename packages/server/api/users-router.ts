// import {selectAllClients} from '@corgifm/common/redux'
// import {UserUpdate} from '@corgifm/common/models/User'
// import * as Router from '@koa/router'
// import {Context} from 'koa'
// import {ServerStore} from '../server-redux-types'
// import {DBStore} from '../database/database'
// import {requireEmailVerifiedUser, checkUid} from '../security-middleware'
// import {validate} from '../server-validation'

// export const usersRouter = (
// 	serverStore: ServerStore,
// 	dbStore: DBStore,
// ): Router => {

// 	const secureRouter = new Router()
// 		.use(requireEmailVerifiedUser)
// 		.get('/:uid', checkUid, getUser)
// 		.put('/:uid', checkUid, validate(UserUpdate, putUser))

// 	const publicRouter = new Router()
// 		.get(`/count`, getCount)
// 		.use(secureRouter.routes(), secureRouter.allowedMethods())

// 	return publicRouter

// 	async function getCount(ctx: Context) {
// 		ctx.body = selectAllClients(serverStore.getState()).length
// 	}

// 	async function getUser(ctx: Context) {
// 		const user = await dbStore.users.getByUid(ctx.params.uid)

// 		if (user === null) {
// 			ctx.status = 404
// 			ctx.body = {
// 				message: `userNotFound`,
// 			}
// 		} else {
// 			ctx.status = 200
// 			ctx.body = user
// 		}
// 	}

// 	async function putUser(ctx: Context, user: UserUpdate) {
// 		// save to DB and return 204
// 		// TODO I don't like that we're pulling the uid out of the params here
// 		await dbStore.users.updateOrCreate(user, ctx.params.uid)

// 		ctx.status = 204
// 	}
// }
