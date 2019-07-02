
import {Router} from 'express'
import {ServerStore} from '../server-redux-types'
import {authRouter} from './auth-router'
import {usersRouter} from './users-router'

export const apiRouter = (serverStore: ServerStore): Router => {

	const router = Router()

	router.use('/users', usersRouter(serverStore))
	router.use('/auth', authRouter(serverStore))

	return router
}
