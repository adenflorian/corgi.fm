import {MongoClient} from 'mongodb'
import {logger} from '../../common/logger'
import {eventsQueries} from './events'
import {startInMemoryDB} from './memory-database'

export type DBStore = ThenArg<typeof connectDB>

type ThenArg<T> = T extends Promise<infer U> ? U :
	T extends (...args: any[]) => Promise<infer V> ? V :
	T

const dbName = 'test'

export async function connectDB() {
	const uri = await startInMemoryDB(dbName)

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
