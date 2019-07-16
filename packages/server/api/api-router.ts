import {Router} from 'express'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {usersRouter} from './users-router'

export const apiRouter = async (
	serverStore: ServerStore,
	dbStore: DBStore,
): Promise<Router> => {
	const router = Router()

	router.use('/users', usersRouter(serverStore))

	return router
}
