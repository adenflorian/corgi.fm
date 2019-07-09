
import * as bcrypt from 'bcrypt'
import {Router} from 'express'
import {sign} from 'jsonwebtoken'
import {TokenHolder} from '../../common/common-types'
import {logger} from '../../common/logger'
import {DBStore} from '../database/database'
import {isRegister} from '../database/users'
import {ServerStore} from '../server-redux-types'
import {ServerSecrets} from '../server-secrets'

const maxPasswordLength = 50
const minPasswordLength = 8

export const authRouter = async (
	serverStore: ServerStore,
	dbStore: DBStore,
	serverSecrets: ServerSecrets,
): Promise<Router> => {

	const router = Router()

	const {jwtSecret} = serverSecrets

	router.post('/register', async (req, res) => {
		// Input validation
		if (!isRegister(req.body)) return res.status(400).json({message: 'password must be a string'})
		if (req.body.password.length > maxPasswordLength || req.body.password.length < minPasswordLength) {
			return res.status(400).json({
				message: `password must be gte ${minPasswordLength} and lte ${maxPasswordLength}`,
			})
		}

		// Make sure email doesn't already exist
		const existingUser = await dbStore.users.getUserByEmail(req.body.email)
		logger.debug('email exist')
		if (existingUser) return res.status(400).json({message: 'email exists'})

		// Hash
		const startTime = Date.now()
		const hash = await bcrypt.hash(req.body.password, 12)
		logger.log('/register hash: ', {time: `${Date.now() - startTime}ms`})

		// Register in DB
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
