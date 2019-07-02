
import {Router} from 'express'
import {ServerStore} from '../server-redux-types'

export const authRouter = (serverStore: ServerStore): Router => {

	const router = Router()

	router.post('/register', (_, res) => {
		res.json({status: 'coming soon'})
	})

	router.post('/login', (req, res) => {
		res.json({status: 'coming soon'})
	})

	return router
}
