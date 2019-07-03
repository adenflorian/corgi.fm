
import {Router} from 'express'
import {DBStore} from '../database/database'
import {isRegister} from '../database/users'
import {ServerStore} from '../server-redux-types'

export const authRouter = (serverStore: ServerStore, dbStore: DBStore): Router => {

	const router = Router()

	router.post('/register', async (req, res) => {
		if (!isRegister(req.body)) return res.status(400).json({message: 'oops'})
		// TODO Hash pw
		await dbStore.users.register(req.body)
		return res.json({status: 'coming soon'})
	})

	router.post('/login', (req, res) => {
		res.json({status: 'coming soon'})
	})

	return router
}
