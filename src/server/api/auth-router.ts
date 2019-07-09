
import * as bcrypt from 'bcrypt'
import {Router} from 'express'
import {sign} from 'jsonwebtoken'
import {TokenHolder} from '../../common/common-types'
import {logger} from '../../common/logger'
import {DBStore} from '../database/database'
import {isRegister} from '../database/users'
import {ServerStore} from '../server-redux-types'
import {ServerSecrets} from '../server-secrets'

export const authRouter = async (
	serverStore: ServerStore,
	dbStore: DBStore,
	serverSecrets: ServerSecrets,
): Promise<Router> => {

	const router = Router()

	const {jwtSecret} = serverSecrets

	router.post('/register', async (req, res) => {
		if (!isRegister(req.body)) return res.status(400).json({message: 'oops'})
		if (req.body.password.length > 50) return res.status(400).json({message: 'oops'})

		const startTime = Date.now()
		const hash = await bcrypt.hash(req.body.password, 12)
		logger.log('/register hash: ', {time: `${Date.now() - startTime}ms`})

		const id = await dbStore.users.register({
			...req.body,
			password: hash,
		})

		const tokenHolder: TokenHolder = {
			token: await sign({id}, jwtSecret),
		}

		return res.json(tokenHolder)
	})

	router.post('/login', (req, res) => {
		res.json({status: 'coming soon'})
	})

	return router
}
