import {Router} from 'express'
import {selectAllClients} from '@corgifm/common/redux'
import {ServerStore} from '../server-redux-types'

export const usersRouter = (serverStore: ServerStore): Router => {
	const router = Router()

	router.get('/count', (_, res) => {
		res.json(selectAllClients(serverStore.getState()).length)
	})

	return router
}
