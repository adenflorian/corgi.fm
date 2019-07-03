import {MongoClient} from 'mongodb'
import {ThenArg} from '../../common/common-types'
import {logger} from '../../common/logger'
import {getDbConnector} from '../server-config'
import {eventsQueries} from './events'
import {usersQueries} from './users'

export type DBStore = ThenArg<typeof connectDB>

const dbName = 'test'

export const dummyDb: DBStore = Object.freeze({
	async close() {},
	events: {
		async saveUserConnectEventAsync() {return 0},
	},
	users: {
		async getUserByEmail() {throw new Error('no db for getUserByEmail')},
		async register() {throw new Error('no db for register')},
	},
})

export async function connectDB() {
	const uri = await getDbConnector()(dbName)

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.debug('Connected successfully to mongo server')

	const db = client.db(dbName)

	return {
		events: eventsQueries(db),
		users: usersQueries(db),
		async close() {
			await client.close()
			logger.debug('db closed')
		},
	}
}
