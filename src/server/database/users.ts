import {Db} from 'mongodb'
import {logger} from '../../common/logger'

const usersCollectionName = 'users'

export const usersQueries = (db: Db) => Object.freeze({
	async getUserByEmail(email: string) {
		const startTime = Date.now()
		logger.log('getUserByEmail: ', {email})
		const result: Register | null = await db.collection(usersCollectionName).findOne({email})
		if (!isRegister(result)) return null
		logger.log('getUserByEmail result: ', {result, time: `${Date.now() - startTime}ms`})
		return {
			email: result.email,
		}
	},
	async register(register: Register) {
		const startTime = Date.now()
		logger.log('register: ', {register})
		const result = await db.collection(usersCollectionName).insertOne(register)
		logger.log('register result: ', {result, time: `${Date.now() - startTime}ms`})
		return {
			token: 'TODO',
		}
	},
})

interface UserConnectedEvent {
	username: string
	room: string
	time: Date
}

interface Register {
	email: string
	password: string
}

export function isRegister(arg: any): arg is Register {
	return arg && arg.email && typeof (arg.email) === 'string'
		&& arg.password && typeof (arg.password) === 'string'
}
