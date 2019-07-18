import {Router} from 'express'
import {usersResourcePathName} from '@corgifm/common/common-constants'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {usersRouter} from './users-router'

export const apiRouter = async (
	serverStore: ServerStore,
	dbStore: DBStore,
): Promise<Router> => {
	const router = Router()

	router.use('/' + usersResourcePathName, usersRouter(serverStore))

	return router
}
