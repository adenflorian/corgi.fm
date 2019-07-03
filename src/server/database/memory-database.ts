import {MongoMemoryServer} from 'mongodb-memory-server'
import {logger} from '../../common/logger'

const eventsCollectionName = 'events'

export async function startInMemoryDB(dbName: string) {
	const mongo = new MongoMemoryServer({instance: {dbName, port: 27017}})

	const uri = await mongo.getConnectionString()

	logger.log('started mongo in memory: ', uri)

	return uri
}
