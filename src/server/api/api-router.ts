
import {Router} from 'express'
import {selectAllClients} from '../../common/redux'
import {ServerStore} from '../server-redux-types'

export const apiRouter = (serverStore: ServerStore): Router => {

	const router = Router()

	router.get('/users/count', (_, res) => {
		res.json(selectAllClients(serverStore.getState()).length)
	})

	return router
}
