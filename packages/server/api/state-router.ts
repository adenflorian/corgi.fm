import {Router} from 'express'
import {selectRoomStateByName} from '../../common/redux'
import {ServerStore} from '../server-redux-types'

export const stateRouter = (serverStore: ServerStore): Router => {

	const router = Router()

	router.get('/', (_, res) => {
		res.json(serverStore.getState())
	})

	router.get('/:room', (req, res) => {
		res.json(
			selectRoomStateByName(serverStore.getState(), req.params.room) || {})
	})

	return router
}
