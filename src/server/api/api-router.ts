
import {Router} from 'express'
import {DBStore} from '../database/database'
import {ServerStore} from '../server-redux-types'
import {authRouter} from './auth-router'
import {usersRouter} from './users-router'

export const apiRouter = (serverStore: ServerStore, dbStore: DBStore): Router => {

	const router = Router()

	router.use('/users', usersRouter(serverStore))
	router.use('/auth', authRouter(serverStore, dbStore))

	return router
}
