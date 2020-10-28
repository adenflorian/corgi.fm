import {MongoClient} from 'mongodb'
import {logger} from '@corgifm/common/logger'
import {getDbConnector} from '../server-config'
import {eventsQueries} from './events'
import {usersQueries} from './users'
import {uploadsQueries} from './uploads'

export type DBStore = ThenArg<typeof connectDB>

const dbName = 'test'

export async function connectDB() {
	const {uri, stop} = await getDbConnector()(dbName)

	logger.debug('connecting to mongo: ', {uri})

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.debug('Connected successfully to mongo server')

	const db = client.db(dbName)

	return {
		db,
		events: await eventsQueries(db),
		users: await usersQueries(db),
		uploads: await uploadsQueries(db),
		async close() {
			await client.close()
			await stop()
			logger.debug('db closed')
		},
	} as const
}
