import {MongoClient} from 'mongodb'
import {ThenArg} from '../../common/common-types'
import {logger} from '../../common/logger'
import {getDbConnector} from '../server-config'
import {eventsQueries} from './events'

export type DBStore = ThenArg<typeof connectDB>

const dbName = 'test'

export async function connectDB() {

	const uri = await getDbConnector()(dbName)

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.log('Connected successfully to mongo server')

	const db = client.db(dbName)

	return {
		events: eventsQueries(db),
		async close() {
			await client.close()
			logger.log('db closed')
		},
	}
}
