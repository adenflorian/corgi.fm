import {Router} from 'express'
import {selectAllClients} from '@corgifm/common/redux'
import {ServerStore} from '../server-redux-types'

export const usersRouter = (serverStore: ServerStore): Router => {
	const router = Router()

	router.get(`/count`, (_, res) => {
		res.json(selectAllClients(serverStore.getState()).length)
	})

	router.get('/:userId', ({params: {userId}}, res) => {
		res.status(200).json({test, userId})
	})

	router.put('/:userId', ({params: {userId}}, res) => {
		res.sendStatus(204)
	})

	return router
}
