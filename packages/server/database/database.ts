import {MongoClient} from 'mongodb'
import {ThenArg} from '@corgifm/common/common-types'
import {logger} from '@corgifm/common/logger'
import {getDbConnector} from '../server-config'
import {eventsQueries} from './events'

export type DBStore = ThenArg<typeof connectDB>

const dbName = 'test'

export const dummyDb: DBStore = Object.freeze({
	async close() {},
	events: {
		async saveUserConnectEventAsync() {return 0},
	},
})

export async function connectDB() {
	const {uri, stop} = await getDbConnector()(dbName)

	logger.log('connecting to mongo: ', {uri})

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.debug('Connected successfully to mongo server')

	const db = client.db(dbName)

	return {
		events: eventsQueries(db),
		async close() {
			await client.close()
			await stop()
			logger.debug('db closed')
		},
	}
}
