import {MongoClient} from 'mongodb'
import {ThenArg} from '@corgifm/common/common-types'
import {logger} from '@corgifm/common/logger'
import {getDbConnector} from '../server-config'
import {eventsQueries} from './events'
import {usersQueries} from './users'

export type DBStore = ThenArg<typeof connectDB>

const dbName = 'test'

export const dummyDb: DBStore = {
	async close() {/* noop */},
	events: {
		async saveUserConnectEventAsync() {return 0},
	},
	users: {
		async updateOrCreate() {return},
		async getByUid() {return null},
	},
}

export async function connectDB() {
	const {uri, stop} = await getDbConnector()(dbName)

	logger.debug('connecting to mongo: ', {uri})

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.debug('Connected successfully to mongo server')

	const db = client.db(dbName)

	return {
		events: eventsQueries(db),
		users: usersQueries(db),
		async close() {
			await client.close()
			await stop()
			logger.debug('db closed')
		},
	} as const
}
