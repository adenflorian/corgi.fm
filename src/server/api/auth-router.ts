
import {Router} from 'express'
import {sign} from 'jsonwebtoken'
import {TokenHolder} from '../../common/common-types'
import {DBStore} from '../database/database'
import {isRegister} from '../database/users'
import {ServerStore} from '../server-redux-types'

// TODO Make secret
const privateKey = 'woo foo'

export const authRouter = (serverStore: ServerStore, dbStore: DBStore): Router => {

	const router = Router()

	router.post('/register', async (req, res) => {
		if (!isRegister(req.body)) return res.status(400).json({message: 'oops'})
		// TODO Hash pw
		const id = await dbStore.users.register(req.body)

		const tokenHolder: TokenHolder = {
			token: await sign({id}, privateKey),
		}

		return res.json(tokenHolder)
	})

	router.post('/login', (req, res) => {
		res.json({status: 'coming soon'})
	})

	return router
}
