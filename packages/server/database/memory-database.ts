import {logger} from '@corgifm/common/logger'

export async function startInMemoryDB(dbName: string) {
	// Only require if called, because it's a dev dependency
	// Should only be user for local development
	const {MongoMemoryServer} = require('mongodb-memory-server')
	const mongo = new MongoMemoryServer({instance: {dbName, port: 27017}})

	const uri = await mongo.getConnectionString()

	logger.debug('started mongo in memory: ', uri)

	return {
		uri,
		stop: async () => await mongo.stop(),
	}
}
