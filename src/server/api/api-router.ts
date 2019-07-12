
import {Router} from 'express'
import {DBStore} from '../database/database'
import {ServerStore} from '../server-redux-types'
import {ServerSecrets} from '../server-secrets'
import {usersRouter} from './users-router'

export const apiRouter = async (
	serverStore: ServerStore,
	dbStore: DBStore,
	serverSecrets: ServerSecrets,
): Promise<Router> => {

	const router = Router()

	router.use('/users', usersRouter(serverStore))

	return router
}
