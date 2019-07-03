import {MongoClient} from 'mongodb'
import {MongoMemoryServer} from 'mongodb-memory-server'
import {logger} from '../../common/logger'

export type DBStore = ThenArg<typeof connectDB>

type ThenArg<T> = T extends Promise<infer U> ? U :
	T extends (...args: any[]) => Promise<infer V> ? V :
	T

const dbName = 'test'

const eventsCollectionName = 'events'

export async function connectDB() {
	const mongo = new MongoMemoryServer({instance: {dbName, port: 27017}})

	const uri = await mongo.getConnectionString()

	logger.log('started mongo in memory: ', uri)

	const client = await MongoClient.connect(uri, {useNewUrlParser: true})

	logger.log('Connected successfully to mongo server')

	const db = client.db(dbName)

	// TODO When to close? If ever?
	// client.close()

	return {
		async saveUserConnectEventAsync(event: UserConnectedEvent) {
			const startTime = Date.now()
			logger.log('saveUserConnectEvent: ', {event})
			const result = await db.collection(eventsCollectionName).insertOne(event)
			logger.log('saveUserConnectEvent result: ', {insertedCount: result.insertedCount, time: `${Date.now() - startTime}ms`})
			return result
		},
		async close() {
			await client.close()
			logger.log('db closed')
		},
	}
}

interface UserConnectedEvent {
	username: string
	room: string
	time: Date
}
