import {Router} from 'express'
import {selectAllClients} from '@corgifm/common/redux'
// import {validateOrReject} from 'class-validator'
// import {User} from '@corgifm/common/models/User'
// import {plainToClass} from 'class-transformer'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'

export const usersRouter = (
	serverStore: ServerStore,
	dbStore: DBStore,
): Router => {
	const router = Router()

	router.get(`/count`, (_, res) => {
		res.json(selectAllClients(serverStore.getState()).length)
	})

	router.get('/:userId', ({params: {userId}}, res) => {
		// if missing userId return 400
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		return res.status(404).json({
			message: `userNotFound`,
		})
	})

	router.put('/:userId', ({params: {userId}, body}, res, next) => {
		// const user = plainToClass(User, body)

		// await validateOrReject(user, {validationError: {target: false}})
		// 	.catch(next)

		// if missing userId return 400
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		return res.status(501).json({
			message: `userNotFound`,
		})
	})

	return router
}
